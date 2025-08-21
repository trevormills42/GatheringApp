import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeckCard } from "@/components/deck-card";
import { ImportModal } from "@/components/import-modal";
import { Plus, Search, Link as LinkIcon, FileText, Settings, User, Layers } from "lucide-react";
import { Link } from "wouter";
import { type Deck } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });

  // Mutation to create a deck from imported data
  const createDeckMutation = useMutation({
    mutationFn: async (deckData: any) => {
      const response = await apiRequest("POST", "/api/decks", {
        name: deckData.name || "Imported Deck",
        format: deckData.format || "Commander",
        description: "",
        mainboard: deckData.mainboard || [],
        sideboard: deckData.sideboard || [],
        considering: deckData.considering || [],
        colorIdentity: [],
        tags: [],
        isPublic: 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Deck has been added to your collection",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save imported deck",
        variant: "destructive",
      });
    },
  });

  const recentDecks = decks?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">MTG</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">MTG Builder</h1>
            <p className="text-xs text-slate-300">Build your perfect deck</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" data-testid="button-settings">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" data-testid="button-profile">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main>
        {/* Quick Actions */}
        <section className="px-4 py-8 bg-gradient-to-br from-primary via-primary to-secondary text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-6 text-center">What would you like to do?</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/deck-builder/new">
                <Button
                  variant="ghost"
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/20 h-auto p-6 flex-col space-y-3 w-full rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
                  data-testid="button-new-deck"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-base font-semibold">New Deck</span>
                    <p className="text-xs text-white/80 mt-1">Start fresh</p>
                  </div>
                </Button>
              </Link>
              <Link href="/search">
                <Button
                  variant="ghost"
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/20 h-auto p-6 flex-col space-y-3 w-full rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
                  data-testid="button-search-cards"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-base font-semibold">Search Cards</span>
                    <p className="text-xs text-white/80 mt-1">Find any card</p>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Import Section */}
        <section className="px-4 py-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Import Existing Deck</h3>
            <p className="text-sm text-gray-600">Bring your decks from other platforms</p>
          </div>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 h-auto p-5 justify-start rounded-xl shadow-sm transition-all duration-300 hover:shadow-md"
              onClick={() => setIsImportModalOpen(true)}
              data-testid="button-import-url"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-blue-900 text-base">Import from URL</div>
                <div className="text-sm text-blue-700 mt-1">Archidekt, Moxfield, or other platforms</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 h-auto p-5 justify-start rounded-xl shadow-sm transition-all duration-300 hover:shadow-md"
              onClick={() => setIsImportModalOpen(true)}
              data-testid="button-import-text"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-green-900 text-base">Import from Text</div>
                <div className="text-sm text-green-700 mt-1">Paste deck list as text</div>
              </div>
            </Button>
          </div>
        </section>

        {/* Recent Decks */}
        <section className="px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Your Recent Decks</h3>
              <p className="text-sm text-gray-600">Continue where you left off</p>
            </div>
            <Link href="/decks">
              <Button variant="link" className="text-primary p-0 font-semibold" data-testid="link-view-all-decks">
                View All →
              </Button>
            </Link>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && recentDecks.length === 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-primary" />
                </div>
                <div className="text-gray-900 mb-2 text-lg font-semibold" data-testid="text-no-decks">
                  No decks yet
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Start building your first MTG deck to see it here
                </p>
                <Link href="/deck-builder/new">
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Deck
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {recentDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      </main>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(deckData) => {
          // Save the imported deck to storage
          createDeckMutation.mutate(deckData);
        }}
      />
    </div>
  );
}
