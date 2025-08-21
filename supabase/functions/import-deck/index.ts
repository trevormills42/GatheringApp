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
        const { url, platform } = await req.json();

        if (!url || !platform) {
            throw new Error('URL and platform are required');
        }

        let deckData;

        if (platform === 'archidekt') {
            // Extract deck ID from Archidekt URL
            const deckIdMatch = url.match(/\/decks\/(\d+)/);
            if (!deckIdMatch) {
                throw new Error('Invalid Archidekt URL format. Expected: https://archidekt.com/decks/{id}');
            }
            
            const deckId = deckIdMatch[1];
            const apiUrl = `https://archidekt.com/api/decks/${deckId}/`;
            
            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'GatherDeck-Import/1.0',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Deck not found. Please check the URL and ensure the deck is public.');
                }
                throw new Error(`Failed to fetch deck from Archidekt: ${response.status}`);
            }

            deckData = await response.json();

        } else if (platform === 'moxfield') {
            // Extract deck ID from Moxfield URL
            const deckIdMatch = url.match(/\/decks\/([a-zA-Z0-9_-]+)/);
            if (!deckIdMatch) {
                throw new Error('Invalid Moxfield URL format. Expected: https://www.moxfield.com/decks/{id}');
            }
            
            const deckId = deckIdMatch[1];
            const apiUrl = `https://api.moxfield.com/v2/decks/all/${deckId}`;
            
            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'GatherDeck-Import/1.0',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Deck not found. Please check the URL and ensure the deck is public.');
                }
                throw new Error(`Failed to fetch deck from Moxfield: ${response.status}`);
            }

            deckData = await response.json();

        } else {
            throw new Error('Unsupported platform. Only Archidekt and Moxfield are supported.');
        }

        return new Response(JSON.stringify(deckData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Import deck error:', error);

        const errorResponse = {
            error: {
                code: 'IMPORT_DECK_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});