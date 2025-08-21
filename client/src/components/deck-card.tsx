import { type Deck } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DeckCardProps {
  deck: Deck;
}

export function DeckCard({ deck }: DeckCardProps) {
  const totalCards = (deck.mainboard as any[]).reduce((sum, card) => sum + (card.quantity || 1), 0) +
                    (deck.sideboard as any[]).reduce((sum, card) => sum + (card.quantity || 1), 0);

  const getColorIndicators = (colorIdentity: string[]) => {
    const colorMap: Record<string, string> = {
      W: "bg-yellow-100 border-yellow-400",
      U: "bg-blue-500",
      B: "bg-gray-900",
      R: "bg-red-500",
      G: "bg-green-500",
    };

    if (colorIdentity.length === 0) {
      return (
        <div className="w-3 h-3 bg-gray-200 border-2 border-gray-400 rounded-full" />
      );
    }

    return colorIdentity.map((color, index) => (
      <div
        key={color}
        className={cn("w-3 h-3 rounded-full", colorMap[color] || "bg-gray-300")}
      />
    ));
  };

  return (
    <Link href={`/deck-builder/${deck.id}`}>
      <Card className="hover:shadow-sm transition-shadow cursor-pointer" data-testid={`deck-card-${deck.id}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 truncate" data-testid="deck-name">
              {deck.name}
            </h4>
            <Badge variant="secondary" className="text-xs" data-testid="deck-format">
              {deck.format}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span data-testid="deck-card-count">{totalCards} cards</span>
            <span data-testid="deck-last-modified">
              {formatDistanceToNow(new Date(deck.updatedAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center space-x-1 mt-2">
            {getColorIndicators(deck.colorIdentity)}
            {deck.colorIdentity.length > 0 && (
              <span className="text-xs text-gray-500 ml-1">
                {deck.colorIdentity.join("/")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
