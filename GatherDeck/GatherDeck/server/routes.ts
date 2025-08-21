import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDeckSchema } from "@shared/schema";
import { scryfallService } from "./services/scryfall";
import { deckParser } from "./services/deckParser";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Deck routes
  app.get("/api/decks", async (req, res) => {
    try {
      const decks = await storage.getDecks();
      res.json(decks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch decks" });
    }
  });

  app.get("/api/decks/:id", async (req, res) => {
    try {
      const deck = await storage.getDeck(req.params.id);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deck" });
    }
  });

  app.post("/api/decks", async (req, res) => {
    try {
      const validatedData = insertDeckSchema.parse(req.body);
      const deck = await storage.createDeck(validatedData);
      res.status(201).json(deck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid deck data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create deck" });
    }
  });

  app.put("/api/decks/:id", async (req, res) => {
    try {
      const validatedData = insertDeckSchema.partial().parse(req.body);
      const deck = await storage.updateDeck(req.params.id, validatedData);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid deck data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update deck" });
    }
  });

  app.delete("/api/decks/:id", async (req, res) => {
    try {
      const success = await storage.deleteDeck(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deck" });
    }
  });

  // Card search routes
  app.get("/api/cards/search", async (req, res) => {
    try {
      const { q, page = "1" } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const results = await scryfallService.searchCards(q, parseInt(page as string, 10));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search cards" });
    }
  });

  app.get("/api/cards/named", async (req, res) => {
    try {
      const { exact, fuzzy } = req.query;
      if (!exact && !fuzzy) {
        return res.status(400).json({ error: "Either 'exact' or 'fuzzy' parameter is required" });
      }

      const card = await scryfallService.getCardByName(
        (exact as string) || (fuzzy as string),
        !!exact
      );
      
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      
      res.json(card);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch card" });
    }
  });

  app.get("/api/cards/autocomplete", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const suggestions = await scryfallService.getAutocomplete(q);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get autocomplete suggestions" });
    }
  });

  app.get("/api/cards/:id/rulings", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Card ID is required" });
      }
      
      const rulings = await scryfallService.getCardRulings(id);
      if (!rulings) {
        return res.status(404).json({ error: "Card rulings not found" });
      }
      
      res.json(rulings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch card rulings" });
    }
  });

  // Import routes
  app.post("/api/import/url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      const deckData = await deckParser.parseFromUrl(url);
      res.json(deckData);
    } catch (error) {
      res.status(400).json({ error: "Failed to import deck from URL" });
    }
  });

  app.post("/api/import/text", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const deckData = await deckParser.parseFromText(text);
      res.json(deckData);
    } catch (error) {
      res.status(400).json({ error: "Failed to import deck from text" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
