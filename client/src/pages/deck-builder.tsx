import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ManaSymbols } from "@/components/ui/mana-symbols";
import { CardSearch } from "@/components/card-search";
import { CardPreview } from "@/components/card-preview";
import { ArrowLeft, Share, Plus, Minus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Deck, type DeckCard } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function DeckBuilder() {
  const params = useParams();
  const deckId = params.id as string;
  const isNewDeck = deckId === "new";
  
  const [deckName, setDeckName] = useState("New Deck");
  const [deckFormat, setDeckFormat] = useState("Standard");
  const [mainboard, setMainboard] = useState<DeckCard[]>([]);
  const [sideboard, setSideboard] = useState<DeckCard[]>([]);
  const [considering, setConsidering] = useState<DeckCard[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<DeckCard | null>(null);
  const [activeTab, setActiveTab] = useState<"mainboard" | "sideboard" | "considering">("mainboard");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing deck
  const { data: existingDeck, isLoading } = useQuery<Deck>({
    queryKey: ["/api/decks", deckId],
    enabled: !isNewDeck,
  });

  // Populate form with existing deck data
  useEffect(() => {
    if (existingDeck) {
      setDeckName(existingDeck.name);
      setDeckFormat(existingDeck.format);
      setMainboard((existingDeck.mainboard as DeckCard[]) || []);
      setSideboard((existingDeck.sideboard as DeckCard[]) || []);
      setConsidering((existingDeck.considering as DeckCard[]) || []);
    }
  }, [existingDeck]);

  // Save deck mutation
  const saveDeckMutation = useMutation({
    mutationFn: async () => {
      const deckData = {
        name: deckName,
        format: deckFormat,
        mainboard,
        sideboard,
        considering,
        colorIdentity: getColorIdentity(),
        description: "",
        tags: [],
        isPublic: 0,
      };

      if (isNewDeck) {
        const response = await apiRequest("POST", "/api/decks", deckData);
        return response.json();
      } else {
        const response = await apiRequest("PUT", `/api/decks/${deckId}`, deckData);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Deck saved",
        description: `${deckName} has been saved successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save deck",
        variant: "destructive",
      });
    },
  });

  const getColorIdentity = (): string[] => {
    const colors = new Set<string>();
    [...mainboard, ...sideboard, ...considering].forEach(card => {
      if (card.card_data?.color_identity) {
        card.card_data.color_identity.forEach(color => colors.add(color));
      }
    });
    return Array.from(colors);
  };

  const totalMainboardCards = mainboard.reduce((sum, card) => sum + card.quantity, 0);
  const totalSideboardCards = sideboard.reduce((sum, card) => sum + card.quantity, 0);
  const totalConsideringCards = considering.reduce((sum, card) => sum + card.quantity, 0);
  // Calculate CMC excluding lands (like most deck builders do)
  const nonLandCards = mainboard.filter(card => !card.card_data?.type_line?.includes("Land"));
  const nonLandCardCount = nonLandCards.reduce((sum, card) => sum + card.quantity, 0);
  const avgCMC = nonLandCardCount > 0 
    ? (nonLandCards.reduce((sum, card) => sum + (card.card_data?.cmc || 0) * card.quantity, 0) / nonLandCardCount).toFixed(1)
    : "0.0";

  const creatureCount = mainboard
    .filter(card => card.card_data?.type_line?.includes("Creature"))
    .reduce((sum, card) => sum + card.quantity, 0);
  
  const landCount = mainboard
    .filter(card => card.card_data?.type_line?.includes("Land"))
    .reduce((sum, card) => sum + card.quantity, 0);



  const handleAddCard = (card: DeckCard) => {
    let targetList = mainboard;
    let setTargetList = setMainboard;
    
    if (activeTab === "sideboard") {
      targetList = sideboard;
      setTargetList = setSideboard;
    } else if (activeTab === "considering") {
      targetList = considering;
      setTargetList = setConsidering;
    }
    
    const existingCardIndex = targetList.findIndex(c => c.name === card.name);
    
    if (existingCardIndex >= 0) {
      const updatedList = [...targetList];
      updatedList[existingCardIndex].quantity += 1;
      setTargetList(updatedList);
    } else {
      setTargetList([...targetList, card]);
    }
    
    setIsSearchOpen(false);
  };

  const handleQuantityChange = (cardId: string, delta: number, section: "mainboard" | "sideboard" | "considering") => {
    let targetList = mainboard;
    let setTargetList = setMainboard;
    
    if (section === "sideboard") {
      targetList = sideboard;
      setTargetList = setSideboard;
    } else if (section === "considering") {
      targetList = considering;
      setTargetList = setConsidering;
    }
    
    const updatedList = targetList.map(card => {
      if (card.id === cardId) {
        const newQuantity = Math.max(0, card.quantity + delta);
        return { ...card, quantity: newQuantity };
      }
      return card;
    }).filter(card => card.quantity > 0);
    
    setTargetList(updatedList);
  };

  const handleRemoveCard = (cardId: string, section: "mainboard" | "sideboard" | "considering") => {
    let targetList = mainboard;
    let setTargetList = setMainboard;
    
    if (section === "sideboard") {
      targetList = sideboard;
      setTargetList = setSideboard;
    } else if (section === "considering") {
      targetList = considering;
      setTargetList = setConsidering;
    }
    
    setTargetList(targetList.filter(card => card.id !== cardId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500" data-testid="text-loading">Loading deck...</div>
      </div>
    );
  }

  let currentCards = mainboard;
  if (activeTab === "sideboard") currentCards = sideboard;
  else if (activeTab === "considering") currentCards = considering;

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Link href="/decks">
            <Button variant="ghost" size="sm" className="p-2" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => saveDeckMutation.mutate()}
              disabled={saveDeckMutation.isPending}
              data-testid="button-save-deck"
            >
              {saveDeckMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" size="sm" className="p-2" data-testid="button-share">
              <Share className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <Input
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
          data-testid="input-deck-name"
        />

        <div className="flex items-center space-x-2 mt-2">
          <Select value={deckFormat} onValueChange={setDeckFormat}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Pioneer">Pioneer</SelectItem>
              <SelectItem value="Modern">Modern</SelectItem>
              <SelectItem value="Legacy">Legacy</SelectItem>
              <SelectItem value="Vintage">Vintage</SelectItem>
              <SelectItem value="Commander">Commander</SelectItem>
              <SelectItem value="Alchemy">Alchemy</SelectItem>
              <SelectItem value="Historic">Historic</SelectItem>
              <SelectItem value="Timeless">Timeless</SelectItem>
              <SelectItem value="Pauper">Pauper</SelectItem>
              <SelectItem value="Brawl">Brawl</SelectItem>
              <SelectItem value="Conspiracy">Conspiracy</SelectItem>
              <SelectItem value="Planechase">Planechase</SelectItem>
              <SelectItem value="Archenemy">Archenemy</SelectItem>
              <SelectItem value="Oathbreaker">Oathbreaker</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500" data-testid="text-card-count">
            {totalMainboardCards}/{deckFormat === "Commander" || deckFormat === "Brawl" ? "99" : "60"} cards
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900" data-testid="text-avg-cmc">
              {avgCMC}
            </div>
            <div className="text-xs text-gray-500">Avg CMC</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900" data-testid="text-creature-count">
              {creatureCount}
            </div>
            <div className="text-xs text-gray-500">Creatures</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900" data-testid="text-land-count">
              {landCount}
            </div>
            <div className="text-xs text-gray-500">Lands</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium",
            activeTab === "mainboard"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-gray-500 hover:text-gray-700"
          )}
          onClick={() => setActiveTab("mainboard")}
          data-testid="tab-mainboard"
        >
          Main Deck ({totalMainboardCards})
        </button>
        <button
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium",
            activeTab === "sideboard"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-gray-500 hover:text-gray-700"
          )}
          onClick={() => setActiveTab("sideboard")}
          data-testid="tab-sideboard"
        >
          Sideboard ({totalSideboardCards})
        </button>
        <button
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium",
            activeTab === "considering"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-gray-500 hover:text-gray-700"
          )}
          onClick={() => setActiveTab("considering")}
          data-testid="tab-considering"
        >
          Considering ({totalConsideringCards})
        </button>
      </div>

      {/* Card List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {currentCards.length === 0 ? (
          <div className="p-8 text-center" data-testid="text-no-cards">
            <div className="text-gray-500 mb-2">
              No cards in {activeTab === "mainboard" ? "main deck" : activeTab === "sideboard" ? "sideboard" : "considering"}
            </div>
            <p className="text-sm text-gray-400">
              Use the + button to add cards
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentCards.map((card, index) => (
              <div
                key={`${activeTab}-${index}-${card.id}-${card.name}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50"
                data-testid={`card-${card.id}`}
              >
                <div 
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => setPreviewCard(card)}
                  data-testid={`card-preview-trigger-${card.id}`}
                >
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {card.quantity}
                  </span>
                  <div>
                    <h5 className="font-medium text-gray-900" data-testid="text-card-name">
                      {card.name}
                    </h5>
                    {card.card_data && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {card.card_data.type_line.split(' ')[0]}
                        </Badge>
                        <div>
                          <ManaSymbols manaCost={card.card_data.mana_cost || "0"} size="sm" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(card.id, -1, activeTab)}
                    className="p-1 h-6 w-6"
                    data-testid={`button-decrease-${card.id}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(card.id, 1, activeTab)}
                    className="p-1 h-6 w-6"
                    data-testid={`button-increase-${card.id}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCard(card.id, activeTab)}
                    className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                    data-testid={`button-remove-${card.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Cards FAB */}
      <div className="absolute bottom-24 right-4">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg"
          onClick={() => setIsSearchOpen(true)}
          data-testid="button-add-cards"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Card Search */}
      <CardSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddCard={handleAddCard}
      />

      {/* Card Preview */}
      <CardPreview
        card={previewCard}
        isOpen={previewCard !== null}
        onClose={() => setPreviewCard(null)}
      />
    </div>
  );
}
