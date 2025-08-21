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
        const { action, query, cardName, cardId } = await req.json();

        let result;

        switch (action) {
            case 'search':
                if (!query || query.length < 3) {
                    result = { data: [] };
                    break;
                }

                // Improved search algorithm - prioritize name matches
                let searchUrl;
                
                // Check if query looks like an exact card name search
                const isExactNameQuery = /^[a-zA-Z\s',.-]+$/.test(query) && !query.includes(':');
                
                if (isExactNameQuery) {
                    // For likely card names, search name field first
                    searchUrl = `https://api.scryfall.com/cards/search?q=name:"${encodeURIComponent(query)}" OR name:${encodeURIComponent(query)}&order=name&unique=cards`;
                } else {
                    // For complex queries or searches with operators, use general search
                    searchUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&unique=cards`;
                }

                const searchResponse = await fetch(searchUrl);

                if (searchResponse.status === 404) {
                    result = { data: [] };
                    break;
                }

                if (!searchResponse.ok) {
                    throw new Error(`Scryfall search failed: ${searchResponse.status}`);
                }

                const searchData = await searchResponse.json();

                // Transform Scryfall data to our MTGCard interface
                const transformedResults = searchData.data.slice(0, 20).map((card: any) => ({
                    id: card.id,
                    name: card.name,
                    mana_cost: card.mana_cost || '',
                    cmc: card.cmc || 0,
                    type_line: card.type_line,
                    oracle_text: card.oracle_text || '',
                    colors: card.colors || [],
                    color_identity: card.color_identity || [],
                    set: card.set,
                    set_name: card.set_name,
                    rarity: card.rarity,
                    power: card.power,
                    toughness: card.toughness,
                    image_uris: card.image_uris || {
                        small: '/placeholder-card.png',
                        normal: '/placeholder-card.png'
                    },
                    prices: card.prices || {}
                }));

                result = { data: transformedResults };
                break;

            case 'get_card':
                if (!cardName) {
                    throw new Error('Card name is required');
                }

                const cardResponse = await fetch(
                    `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
                );

                if (!cardResponse.ok) {
                    throw new Error(`Scryfall card lookup failed: ${cardResponse.status}`);
                }

                const cardData = await cardResponse.json();

                result = {
                    id: cardData.id,
                    name: cardData.name,
                    mana_cost: cardData.mana_cost || '',
                    cmc: cardData.cmc || 0,
                    type_line: cardData.type_line,
                    oracle_text: cardData.oracle_text || '',
                    colors: cardData.colors || [],
                    color_identity: cardData.color_identity || [],
                    set: cardData.set,
                    set_name: cardData.set_name,
                    rarity: cardData.rarity,
                    power: cardData.power,
                    toughness: cardData.toughness,
                    image_uris: cardData.image_uris || {
                        small: '/placeholder-card.png',
                        normal: '/placeholder-card.png'
                    },
                    prices: cardData.prices || {}
                };
                break;

            case 'get_rulings':
                if (!cardId && !cardName) {
                    throw new Error('Card ID or card name is required for rulings');
                }

                let rulingsUrl;
                if (cardId) {
                    // Try to get rulings by card ID first
                    rulingsUrl = `https://api.scryfall.com/cards/${encodeURIComponent(cardId)}/rulings`;
                } else {
                    // Fallback: get card by name first, then get rulings
                    const nameResponse = await fetch(
                        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
                    );

                    if (!nameResponse.ok) {
                        throw new Error(`Card not found: ${cardName}`);
                    }

                    const nameData = await nameResponse.json();
                    rulingsUrl = `https://api.scryfall.com/cards/${nameData.id}/rulings`;
                }

                const rulingsResponse = await fetch(rulingsUrl);

                if (!rulingsResponse.ok) {
                    if (rulingsResponse.status === 404) {
                        result = { data: [] }; // No rulings available
                        break;
                    }
                    throw new Error(`Failed to fetch rulings: ${rulingsResponse.status}`);
                }

                const rulingsData = await rulingsResponse.json();
                result = rulingsData; // Return the full rulings response
                break;

            default:
                throw new Error('Invalid action specified');
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Scryfall proxy error:', error);

        const errorResponse = {
            error: {
                code: 'SCRYFALL_PROXY_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});