import { type MTGCard, type ScryfallRulingsResponse } from "@shared/schema";

interface ScryfallSearchResponse {
  object: string;
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: MTGCard[];
}

interface ScryfallAutocompleteResponse {
  object: string;
  total_values: number;
  data: string[];
}

class ScryfallService {
  private readonly baseUrl = "https://api.scryfall.com";
  private readonly delay = 100; // Scryfall API rate limit: 100ms between requests

  private async makeRequest<T>(endpoint: string): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
    
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json() as T;
  }

  async searchCards(query: string, page: number = 1): Promise<ScryfallSearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    return this.makeRequest<ScryfallSearchResponse>(
      `/cards/search?q=${encodedQuery}&page=${page}&order=name`
    );
  }

  async getCardByName(name: string, exact: boolean = false): Promise<MTGCard | null> {
    try {
      const endpoint = exact 
        ? `/cards/named?exact=${encodeURIComponent(name)}`
        : `/cards/named?fuzzy=${encodeURIComponent(name)}`;
      
      return await this.makeRequest<MTGCard>(endpoint);
    } catch (error) {
      return null;
    }
  }

  async getAutocomplete(query: string): Promise<string[]> {
    try {
      const response = await this.makeRequest<ScryfallAutocompleteResponse>(
        `/cards/autocomplete?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      return [];
    }
  }

  async getCardById(id: string): Promise<MTGCard | null> {
    try {
      return await this.makeRequest<MTGCard>(`/cards/${id}`);
    } catch (error) {
      return null;
    }
  }

  async getCardRulings(id: string): Promise<ScryfallRulingsResponse | null> {
    try {
      return await this.makeRequest<ScryfallRulingsResponse>(`/cards/${id}/rulings`);
    } catch (error) {
      return null;
    }
  }
}

export const scryfallService = new ScryfallService();
