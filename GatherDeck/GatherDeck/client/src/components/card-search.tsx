import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ManaSymbols } from "@/components/ui/mana-symbols";
import { ArrowLeft, Filter, Plus } from "lucide-react";
import { type MTGCard, type DeckCard } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CardSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard?: (card: DeckCard) => void;
}

export function CardSearch({ isOpen, onClose, onAddCard }: CardSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/cards/search", { q: debouncedQuery, page: 1 }],
    enabled: debouncedQuery.length > 2,
  });

  const handleAddCard = (card: MTGCard) => {
    if (onAddCard) {
      const deckCard: DeckCard = {
        id: card.id,
        name: card.name,
        quantity: 1,
        card_data: card,
      };
      onAddCard(deckCard);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2"
          data-testid="button-close-search"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-100 border-none rounded-full"
            data-testid="input-card-search"
          />
        </div>
        <Button variant="ghost" size="sm" className="p-2" data-testid="button-filter">
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {/* Filter chips */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <Badge variant="default" className="whitespace-nowrap">
            All Formats
          </Badge>
          <Badge variant="secondary" className="whitespace-nowrap">
            Creatures
          </Badge>
          <Badge variant="secondary" className="whitespace-nowrap">
            CMC ≤ 3
          </Badge>
          <Badge variant="secondary" className="whitespace-nowrap">
            Blue
          </Badge>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && debouncedQuery && (
          <div className="p-4 text-center text-gray-500" data-testid="text-loading">
            Searching cards...
          </div>
        )}

        {searchResults?.data && Array.isArray(searchResults.data) && searchResults.data.length > 0 && (
          <div className="divide-y divide-gray-200">
            {searchResults.data.map((card: MTGCard) => (
              <div
                key={card.id}
                className="flex items-center space-x-3 p-4 hover:bg-gray-50"
                data-testid={`card-result-${card.id}`}
              >
                {card.image_uris?.small ? (
                  <img
                    src={card.image_uris.small}
                    alt={card.name}
                    className="w-12 h-16 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500">No Image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900" data-testid="text-card-name">
                    {card.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        card.colors?.includes("R") && "bg-red-100 text-red-800",
                        card.colors?.includes("U") && "bg-blue-100 text-blue-800",
                        card.colors?.includes("G") && "bg-green-100 text-green-800",
                        card.colors?.includes("W") && "bg-yellow-100 text-yellow-800",
                        card.colors?.includes("B") && "bg-gray-100 text-gray-800",
                        (!card.colors || card.colors.length === 0) && "bg-gray-100 text-gray-800"
                      )}
                    >
                      {card.type_line.split(' ')[0]}
                    </Badge>
                    <div data-testid="mana-cost-container">
                      <ManaSymbols manaCost={card.mana_cost || "0"} size="sm" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2" data-testid="text-card-description">
                    {card.oracle_text}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddCard(card)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-full"
                  data-testid={`button-add-card-${card.id}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchResults?.data && Array.isArray(searchResults.data) && searchResults.data.length === 0 && debouncedQuery && (
          <div className="p-4 text-center text-gray-500" data-testid="text-no-results">
            No cards found for "{debouncedQuery}"
          </div>
        )}

        {!debouncedQuery && (
          <div className="p-4 text-center text-gray-500" data-testid="text-search-prompt">
            Type at least 3 characters to search for cards
          </div>
        )}
      </div>
    </div>
  );
}
