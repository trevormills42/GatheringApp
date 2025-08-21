Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, deckId, deckData, userId } = await req.json();

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let currentUser = null;
        
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                currentUser = userData;
            }
        }

        if (!currentUser && action !== 'get_public') {
            throw new Error('Authentication required');
        }

        let result;

        switch (action) {
            case 'create':
                if (!deckData.name || !deckData.format) {
                    throw new Error('Deck name and format are required');
                }
                
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/decks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        ...deckData,
                        user_id: currentUser.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to create deck: ${errorText}`);
                }

                result = await createResponse.json();
                break;

            case 'update':
                if (!deckId) {
                    throw new Error('Deck ID is required for update');
                }

                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/decks?id=eq.${deckId}&user_id=eq.${currentUser.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        ...deckData,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update deck: ${errorText}`);
                }

                result = await updateResponse.json();
                break;

            case 'delete':
                if (!deckId) {
                    throw new Error('Deck ID is required for delete');
                }

                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/decks?id=eq.${deckId}&user_id=eq.${currentUser.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!deleteResponse.ok) {
                    const errorText = await deleteResponse.text();
                    throw new Error(`Failed to delete deck: ${errorText}`);
                }

                result = { success: true };
                break;

            case 'get_user_decks':
                const userDecksResponse = await fetch(`${supabaseUrl}/rest/v1/decks?user_id=eq.${currentUser.id}&order=updated_at.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!userDecksResponse.ok) {
                    const errorText = await userDecksResponse.text();
                    throw new Error(`Failed to fetch user decks: ${errorText}`);
                }

                result = await userDecksResponse.json();
                break;

            case 'get_public':
                const publicDecksResponse = await fetch(`${supabaseUrl}/rest/v1/decks?is_public=eq.1&order=updated_at.desc&limit=20`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!publicDecksResponse.ok) {
                    const errorText = await publicDecksResponse.text();
                    throw new Error(`Failed to fetch public decks: ${errorText}`);
                }

                result = await publicDecksResponse.json();
                break;

            case 'get_deck':
                if (!deckId) {
                    throw new Error('Deck ID is required');
                }

                const deckResponse = await fetch(`${supabaseUrl}/rest/v1/decks?id=eq.${deckId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!deckResponse.ok) {
                    const errorText = await deckResponse.text();
                    throw new Error(`Failed to fetch deck: ${errorText}`);
                }

                const deckData = await deckResponse.json();
                if (deckData.length === 0) {
                    throw new Error('Deck not found');
                }

                // Check if user can access this deck (either owns it or it's public)
                const deck = deckData[0];
                if (deck.user_id !== currentUser?.id && deck.is_public !== 1) {
                    throw new Error('Access denied to private deck');
                }

                result = deck;
                break;

            default:
                throw new Error('Invalid action specified');
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Deck management error:', error);

        const errorResponse = {
            error: {
                code: 'DECK_MANAGEMENT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});