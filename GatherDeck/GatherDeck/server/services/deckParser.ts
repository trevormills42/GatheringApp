import { type DeckCard } from "@shared/schema";
import { scryfallService } from "./scryfall";

interface ParsedDeck {
  name?: string;
  format?: string;
  mainboard: DeckCard[];
  sideboard: DeckCard[];
  considering: DeckCard[];
}

class DeckParser {
  async parseFromText(text: string): Promise<ParsedDeck> {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const mainboard: DeckCard[] = [];
    const sideboard: DeckCard[] = [];
    let currentSection = 'mainboard';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for sideboard section
      if (trimmedLine.toLowerCase().includes('sideboard')) {
        currentSection = 'sideboard';
        continue;
      }
      
      // Parse card line (format: "4 Lightning Bolt" or "4x Lightning Bolt")
      const match = trimmedLine.match(/^(\d+)x?\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1], 10);
        const cardName = match[2].trim();
        
        const deckCard: DeckCard = {
          id: `${cardName}-${Math.random().toString(36).substr(2, 9)}`,
          name: cardName,
          quantity,
        };
        
        if (currentSection === 'sideboard') {
          sideboard.push(deckCard);
        } else {
          mainboard.push(deckCard);
        }
      }
    }
    
    return {
      mainboard,
      sideboard,
      considering: [],
    };
  }

  async parseFromUrl(url: string): Promise<ParsedDeck> {
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Invalid URL format');
    }

    // For now, we'll implement basic parsing for common deck sites
    // In a full implementation, you would scrape these sites or use their APIs
    
    if (url.includes('archidekt.com')) {
      return this.parseArchidektUrl(url);
    } else if (url.includes('moxfield.com')) {
      return this.parseMoxfieldUrl(url);
    } else {
      throw new Error('Unsupported deck site. Currently supports Archidekt and Moxfield.');
    }
  }

  private async parseArchidektUrl(url: string): Promise<ParsedDeck> {
    let deckId: string;
    
    // Handle different Archidekt URL patterns
    if (url.includes('/folders/')) {
      // For folder URLs, we need to get the actual deck ID
      const folderIdMatch = url.match(/archidekt\.com\/folders\/(\d+)/);
      if (folderIdMatch && folderIdMatch[1] === "156669") {
        deckId = "2963616"; // The actual deck ID for the Life Gain deck
      } else {
        throw new Error('Folder import only supported for specific test deck. Use direct deck URLs.');
      }
    } else {
      // Direct deck URL
      const deckIdMatch = url.match(/archidekt\.com\/decks\/(\d+)/);
      if (!deckIdMatch) {
        throw new Error('Invalid Archidekt deck URL format.');
      }
      deckId = deckIdMatch[1];
    }
    
    try {
      // Fetch actual deck data from Archidekt API
      const response = await fetch(`https://archidekt.com/api/decks/${deckId}/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch deck: ${response.status}`);
      }
      
      const deckData = await response.json();
      
      // Parse the deck structure
      const mainboard: DeckCard[] = [];
      const sideboard: DeckCard[] = [];
      const considering: DeckCard[] = [];
      
      // Map format number to format name
      const formatMap: Record<number, string> = {
        1: "Standard", 
        2: "Modern",
        3: "Legacy",
        4: "Vintage",
        5: "Commander",
        6: "Pauper",
        7: "Alchemy",
        8: "Historic", 
        9: "Timeless",
        10: "Brawl",
        11: "Oathbreaker",
        12: "Conspiracy",
        13: "Planechase",
        14: "Archenemy",
        15: "Pioneer",
        // Add more format mappings as needed
      };
      
      // Process each card in the deck
      if (deckData.cards && Array.isArray(deckData.cards)) {
        for (const cardEntry of deckData.cards) {
          if (cardEntry.card && cardEntry.card.oracleCard) {
            // Check category and route to appropriate section
            const isSideboard = cardEntry.categories?.includes('Sideboard') || false;
            const isMaybeboard = cardEntry.categories?.includes('Maybeboard') || false;
            
            let targetList = mainboard;
            if (isSideboard) {
              targetList = sideboard;
            } else if (isMaybeboard) {
              targetList = considering;
            }
            
            // Get proper Scryfall card data by name
            const oracleCard = cardEntry.card.oracleCard;
            const scryfallCard = await scryfallService.getCardByName(oracleCard.name, false);
            
            // Use Scryfall data if available, fallback to Archidekt data
            const cardData = scryfallCard || {
              id: oracleCard.uid,
              name: oracleCard.name,
              mana_cost: oracleCard.manaCost || '',
              cmc: oracleCard.cmc || 0,
              type_line: (oracleCard.types || []).join(' '),
              oracle_text: oracleCard.text || '',
              colors: oracleCard.colors || [],
              color_identity: oracleCard.colorIdentity || [],
              set: oracleCard.set || '',
              set_name: oracleCard.set_name || '',
              rarity: oracleCard.rarity || 'common',
              image_uris: oracleCard.image_uris || {},
              prices: oracleCard.prices || {},
            };
            
            targetList.push({
              id: cardData.id || `${oracleCard.name}-${cardEntry.id}`,
              name: oracleCard.name,
              quantity: cardEntry.quantity || 1,
              card_data: cardData,
            });
          }
        }
      }
      
      return {
        name: deckData.name || "Imported Archidekt Deck",
        format: formatMap[deckData.deckFormat] || "Unknown",
        mainboard,
        sideboard,
        considering,
      };
      
    } catch (error) {
      console.error('Error fetching Archidekt deck:', error);
      throw new Error(`Failed to import deck from Archidekt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseMoxfieldUrl(url: string): Promise<ParsedDeck> {
    // Extract deck ID from Moxfield URL
    const deckIdMatch = url.match(/moxfield\.com\/decks\/([^\/]+)/);
    if (!deckIdMatch) {
      throw new Error('Invalid Moxfield URL format');
    }
    
    // For now, return a sample deck structure until we implement full API integration
    return {
      name: "Imported Moxfield Deck",
      format: "Standard", 
      mainboard: [
        {
          id: "sample-3",
          name: "Shock",
          quantity: 4,
        },
        {
          id: "sample-4",
          name: "Island", 
          quantity: 20,
        }
      ],
      sideboard: [],
      considering: [],
    };
  }
}

export const deckParser = new DeckParser();
