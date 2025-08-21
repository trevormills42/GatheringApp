import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeckCard } from "@/components/deck-card";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { type Deck } from "@shared/schema";

export default function Decks() {
  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">My Decks</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-search-decks">
              <Search className="w-5 h-5" />
            </Button>
            <Link href="/deck-builder/new">
              <Button size="sm" data-testid="button-create-deck">
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-gray-200 rounded-full" />
                    <div className="w-3 h-3 bg-gray-200 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (!decks || decks.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500 mb-2" data-testid="text-no-decks">
                No decks found
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Create your first deck to get started
              </p>
              <Link href="/deck-builder/new">
                <Button data-testid="button-create-first-deck">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Deck
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {decks?.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </main>
    </div>
  );
}
