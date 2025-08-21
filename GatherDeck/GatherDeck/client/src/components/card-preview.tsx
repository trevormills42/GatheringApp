import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ManaSymbols } from "@/components/ui/mana-symbols";
import { useQuery } from "@tanstack/react-query";
import { type DeckCard, type ScryfallRulingsResponse } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface CardPreviewProps {
  card: DeckCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CardPreview({ card, isOpen, onClose }: CardPreviewProps) {
  if (!card || !card.card_data) {
    return null;
  }

  // Get fresh card data by name if current ID doesn't work
  const { data: freshCardData } = useQuery({
    queryKey: ["/api/cards/named", { fuzzy: card.name }],
    enabled: isOpen && !!card.name,
  });

  // Use fresh card data if available, otherwise use stored data
  const effectiveCardData = (freshCardData as any) || card.card_data;

  const { data: rulings } = useQuery<ScryfallRulingsResponse>({
    queryKey: ["/api/cards", effectiveCardData?.id, "rulings"],
    enabled: isOpen && !!effectiveCardData?.id,
  });

  const cardData = effectiveCardData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" data-testid="card-preview-dialog">
        <DialogTitle className="sr-only">{cardData.name} - Card Preview</DialogTitle>
        <DialogDescription className="sr-only">Detailed information about the {cardData.name} Magic: The Gathering card</DialogDescription>
        <div className="flex flex-col md:flex-row h-full">
          {/* Card Image */}
          <div className="md:w-1/2 p-6 bg-gray-50">
            <div className="flex justify-center">
              {(cardData.image_uris?.normal || cardData.image_uris?.large) ? (
                <img
                  src={cardData.image_uris.normal || cardData.image_uris.large}
                  alt={cardData.name}
                  className="rounded-lg shadow-lg max-w-full h-auto"
                  data-testid="card-preview-image"
                  onError={(e) => {
                    console.log('Failed to load image:', cardData.image_uris);
                    e.currentTarget.style.display = 'none';
                    const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextEl) nextEl.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div 
                className={`w-64 h-96 bg-gray-200 rounded-lg flex items-center justify-center ${
                  (cardData.image_uris?.normal || cardData.image_uris?.large) ? 'hidden' : ''
                }`}
                data-testid="card-preview-no-image"
              >
                <span className="text-gray-500">No Image Available</span>
              </div>
            </div>
          </div>

          {/* Card Details */}
          <div className="md:w-1/2 flex flex-col">
            <Tabs defaultValue="details" className="flex-1 overflow-hidden">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="details" className="flex-1" data-testid="tab-details">
                  Details
                </TabsTrigger>
                <TabsTrigger value="rulings" className="flex-1" data-testid="tab-rulings">
                  Rulings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Card Header */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900" data-testid="text-card-title">
                      {cardData.name}
                    </h2>
                    <div className="flex items-center space-x-2 mt-2">
                      <ManaSymbols manaCost={cardData.mana_cost || "0"} size="lg" />
                      <span className="text-sm text-gray-500 ml-auto" data-testid="text-cmc">
                        CMC {cardData.cmc}
                      </span>
                    </div>
                  </div>

                  {/* Type Line */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Type</h3>
                    <p className="text-gray-900" data-testid="text-type-line">
                      {cardData.type_line}
                    </p>
                  </div>

                  {/* Oracle Text */}
                  {cardData.oracle_text && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Rules Text</h3>
                      <div className="prose prose-sm max-w-none">
                        {cardData.oracle_text.split('\n').map((line, index) => (
                          <p key={index} className="text-gray-900 mb-2" data-testid={`text-oracle-${index}`}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Colors</h3>
                    <div className="flex space-x-1">
                      {cardData.colors && cardData.colors.length > 0 ? (
                        cardData.colors.map((color) => (
                          <Badge
                            key={color}
                            variant="secondary"
                            className={`text-xs ${
                              color === "R" ? "bg-red-100 text-red-800" :
                              color === "U" ? "bg-blue-100 text-blue-800" :
                              color === "G" ? "bg-green-100 text-green-800" :
                              color === "W" ? "bg-yellow-100 text-yellow-800" :
                              color === "B" ? "bg-gray-100 text-gray-800" :
                              "bg-gray-100 text-gray-800"
                            }`}
                            data-testid={`badge-color-${color}`}
                          >
                            {color}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800" data-testid="badge-colorless">
                          Colorless
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Set Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Set</h3>
                    <span className="text-gray-900" data-testid="text-set-name">
                      {cardData.set_name || cardData.set}
                    </span>
                  </div>

                  {/* Rarity */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Rarity</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize ${
                        cardData.rarity === 'mythic' ? 'border-orange-500 text-orange-600' :
                        cardData.rarity === 'rare' ? 'border-yellow-500 text-yellow-600' :
                        cardData.rarity === 'uncommon' ? 'border-gray-400 text-gray-600' :
                        'border-gray-300 text-gray-500'
                      }`}
                      data-testid="badge-rarity"
                    >
                      {cardData.rarity}
                    </Badge>
                  </div>

                  {/* Prices */}
                  {cardData.prices && (cardData.prices.usd || cardData.prices.eur) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Prices</h3>
                      <div className="flex space-x-4">
                        {cardData.prices.usd && (
                          <span className="text-sm text-gray-600" data-testid="text-price-usd">
                            USD: ${cardData.prices.usd}
                          </span>
                        )}
                        {cardData.prices.eur && (
                          <span className="text-sm text-gray-600" data-testid="text-price-eur">
                            EUR: €{cardData.prices.eur}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="rulings" className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900" data-testid="text-rulings-title">
                    Card Rulings
                  </h3>
                  
                  {rulings?.data && rulings.data.length > 0 ? (
                    <div className="space-y-4">
                      {rulings.data.map((ruling, index) => (
                        <div
                          key={`${ruling.oracle_id}-${index}`}
                          className="border-l-4 border-blue-500 pl-4 py-2"
                          data-testid={`ruling-${index}`}
                        >
                          <p className="text-gray-900 text-sm mb-2">{ruling.comment}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span data-testid={`ruling-source-${index}`}>
                              {ruling.source}
                            </span>
                            <span>•</span>
                            <span data-testid={`ruling-date-${index}`}>
                              {formatDistanceToNow(new Date(ruling.published_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8" data-testid="text-no-rulings">
                      <p className="text-gray-500 text-sm">
                        No rulings found for this card.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}