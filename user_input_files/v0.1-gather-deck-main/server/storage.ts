import { type Deck, type InsertDeck } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Deck operations
  getDeck(id: string): Promise<Deck | undefined>;
  getDecks(): Promise<Deck[]>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: string, updates: Partial<InsertDeck>): Promise<Deck | undefined>;
  deleteDeck(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private decks: Map<string, Deck>;

  constructor() {
    this.decks = new Map();
  }

  async getDeck(id: string): Promise<Deck | undefined> {
    return this.decks.get(id);
  }

  async getDecks(): Promise<Deck[]> {
    return Array.from(this.decks.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async createDeck(insertDeck: InsertDeck): Promise<Deck> {
    const id = randomUUID();
    const now = new Date();
    const deck: Deck = {
      ...insertDeck,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.decks.set(id, deck);
    return deck;
  }

  async updateDeck(id: string, updates: Partial<InsertDeck>): Promise<Deck | undefined> {
    const existingDeck = this.decks.get(id);
    if (!existingDeck) {
      return undefined;
    }

    const updatedDeck: Deck = {
      ...existingDeck,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.decks.set(id, updatedDeck);
    return updatedDeck;
  }

  async deleteDeck(id: string): Promise<boolean> {
    return this.decks.delete(id);
  }
}

export const storage = new MemStorage();
