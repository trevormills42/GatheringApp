import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const decks = pgTable("decks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  format: text("format").notNull(),
  description: text("description"),
  mainboard: jsonb("mainboard").notNull().default(sql`'[]'::jsonb`),
  sideboard: jsonb("sideboard").notNull().default(sql`'[]'::jsonb`),
  considering: jsonb("considering").notNull().default(sql`'[]'::jsonb`),
  colorIdentity: text("color_identity").array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  isPublic: integer("is_public").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeckSchema = createInsertSchema(decks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Deck = typeof decks.$inferSelect;

// Card interface for MTG cards from Scryfall API
export interface MTGCard {
  id: string;
  name: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  colors: string[];
  color_identity: string[];
  set: string;
  set_name: string;
  rarity: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    art_crop?: string;
  };
  prices: {
    usd?: string;
    eur?: string;
  };
}

// Card ruling interface for Scryfall API
export interface CardRuling {
  object: string;
  oracle_id: string;
  source: string;
  published_at: string;
  comment: string;
}

export interface ScryfallRulingsResponse {
  object: string;
  has_more: boolean;
  data: CardRuling[];
}

// Deck card entry
export interface DeckCard {
  id: string;
  name: string;
  quantity: number;
  card_data?: MTGCard;
}

// Search filters
export interface SearchFilters {
  colors?: string[];
  types?: string[];
  formats?: string[];
  cmc?: {
    min?: number;
    max?: number;
  };
  rarity?: string[];
}
