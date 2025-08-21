"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Minus, Library, ArrowLeft, Save, BarChart3, User, Upload, Eye, ArrowRight, MoveRight, ArrowUpDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCardSearch } from '@/hooks/useCardSearch'
import { useDeckManagement } from '@/hooks/useDeckManagement'
import { useDeckStats } from '@/hooks/useDeckStats'
import { MTGCard, DeckCard, Format } from '@/lib/supabase'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { DeckStatsModal } from '@/components/deck/DeckStatsModal'
import { ImportDialog } from '@/components/deck/ImportDialog'
import { CardInspectionModal } from '@/components/deck/CardInspectionModal'
import '@/components/deck/CardInspectionModal.css'

export default function DeckBuilderPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { searchCards, searchResults, isSearching } = useCardSearch()
  const { createDeck, updateDeck, loading: deckLoading } = useDeckManagement()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [deckName, setDeckName] = useState('Untitled Deck')
  const [deckFormat, setDeckFormat] = useState<Format>('Standard')
  const [mainboard, setMainboard] = useState<DeckCard[]>([])
  const [sideboard, setSideboard] = useState<DeckCard[]>([])
  const [considering, setConsidering] = useState<DeckCard[]>([])
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [statsModalOpen, setStatsModalOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [cardInspectionOpen, setCardInspectionOpen] = useState(false)
  const [inspectedCard, setInspectedCard] = useState<DeckCard | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null)

  // Calculate deck statistics
  const deckStats = useDeckStats(mainboard)

  useEffect(() => {
    if (searchQuery.length >= 3) {
      searchCards(searchQuery)
    }
  }, [searchQuery, searchCards])

  const addToMainboard = (card: MTGCard) => {
    setMainboard(prev => {
      const existing = prev.find(c => c.id === card.id)
      if (existing) {
        return prev.map(c => c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...card, quantity: 1 }]
    })
  }

  const addToSideboard = (card: MTGCard) => {
    setSideboard(prev => {
      const existing = prev.find(c => c.id === card.id)
      if (existing) {
        return prev.map(c => c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...card, quantity: 1 }]
    })
  }

  const addToConsidering = (card: MTGCard) => {
    setConsidering(prev => {
      const existing = prev.find(c => c.id === card.id)
      if (existing) {
        return prev.map(c => c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...card, quantity: 1 }]
    })
  }

  // Transfer functions between sections
  const transferCard = (
    cardId: string, 
    fromSection: 'mainboard' | 'sideboard' | 'considering',
    toSection: 'mainboard' | 'sideboard' | 'considering'
  ) => {
    // Get the card from source section
    const fromSetter = fromSection === 'considering' ? setConsidering : 
                      fromSection === 'sideboard' ? setSideboard : setMainboard
    const toSetter = toSection === 'considering' ? setConsidering : 
                    toSection === 'sideboard' ? setSideboard : setMainboard
    
    const fromCards = fromSection === 'considering' ? considering : 
                     fromSection === 'sideboard' ? sideboard : mainboard
    
    const cardToTransfer = fromCards.find(c => c.id === cardId)
    if (!cardToTransfer) return
    
    // Remove from source section
    fromSetter(prev => prev.filter(c => c.id !== cardId))
    
    // Add to destination section
    toSetter(prev => {
      const existing = prev.find(c => c.id === cardId)
      if (existing) {
        return prev.map(c => c.id === cardId ? 
          { ...c, quantity: c.quantity + cardToTransfer.quantity } : c)
      }
      return [...prev, cardToTransfer]
    })
  }

  const removeFromDeck = (cardId: string, section: 'mainboard' | 'sideboard' | 'considering') => {
    const setter = section === 'considering' ? setConsidering : 
                   section === 'sideboard' ? setSideboard : setMainboard
    
    setter(prev => {
      const existing = prev.find(c => c.id === cardId)
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.id === cardId ? { ...c, quantity: c.quantity - 1 } : c)
      }
      return prev.filter(c => c.id !== cardId)
    })
  }

  const totalMainboardCards = mainboard.reduce((sum, card) => sum + card.quantity, 0)
  const totalSideboardCards = sideboard.reduce((sum, card) => sum + card.quantity, 0)
  const totalConsideringCards = considering.reduce((sum, card) => sum + card.quantity, 0)

  const handleSaveDeck = async () => {
    if (!user) {
      setAuthDialogOpen(true)
      return
    }

    setSaving(true)
    try {
      if (currentDeckId) {
        await updateDeck(currentDeckId, {
          name: deckName,
          format: deckFormat,
          mainboard,
          sideboard,
          considering
        })
      } else {
        const newDeck = await createDeck({
          name: deckName,
          format: deckFormat,
          mainboard,
          sideboard,
          considering
        })
        setCurrentDeckId(newDeck.id)
      }
    } catch (error) {
      console.error('Failed to save deck:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleImportComplete = (importedDeck: {
    name: string
    format: Format
    mainboard: DeckCard[]
    sideboard: DeckCard[]
    considering: DeckCard[]
  }) => {
    setDeckName(importedDeck.name)
    setDeckFormat(importedDeck.format)
    setMainboard(importedDeck.mainboard)
    setSideboard(importedDeck.sideboard)
    setConsidering(importedDeck.considering)
    setCurrentDeckId(null) // Reset deck ID for new imported deck
  }

  const handleCardInspect = (card: DeckCard) => {
    setInspectedCard(card)
    setCardInspectionOpen(true)
  }

  const DeckSection = ({ 
    title, 
    cards, 
    onRemove, 
    section,
    totalCards,
    onInspect,
    onTransfer
  }: {
    title: string
    cards: DeckCard[]
    onRemove: (cardId: string) => void
    section: 'mainboard' | 'sideboard' | 'considering'
    totalCards: number
    onInspect: (card: DeckCard) => void
    onTransfer: (cardId: string, fromSection: 'mainboard' | 'sideboard' | 'considering', toSection: 'mainboard' | 'sideboard' | 'considering') => void
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{totalCards} cards</Badge>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {cards.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No cards in {title.toLowerCase()}
          </div>
        ) : (
          cards.map((card) => (
            <Card key={card.id} className="p-4">
              <div className="flex items-center gap-4">
                {card.image_uris?.small && (
                  <img 
                    src={card.image_uris.small} 
                    alt={card.name}
                    className="w-12 h-16 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onInspect(card)}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 
                      className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors" 
                      onClick={() => onInspect(card)}
                    >
                      {card.name}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {card.mana_cost}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{card.type_line}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {card.oracle_text}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Transfer buttons */}
                  <div className="flex flex-col gap-1">
                    {section !== 'mainboard' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onTransfer(card.id, section, 'mainboard')}
                        className="h-6 w-6 p-0"
                        title="Move to Mainboard"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    )}
                    {section !== 'sideboard' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onTransfer(card.id, section, 'sideboard')}
                        className="h-6 w-6 p-0"
                        title="Move to Sideboard"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                    {section !== 'considering' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onTransfer(card.id, section, 'considering')}
                        className="h-6 w-6 p-0"
                        title="Move to Considering"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onInspect(card)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemove(card.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="font-medium w-6 text-center">{card.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (section === 'mainboard') addToMainboard(card)
                      else if (section === 'sideboard') addToSideboard(card)
                      else addToConsidering(card)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 rounded flex items-center justify-center">
                  <Library className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Deck Builder</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStatsModalOpen(true)}
                disabled={mainboard.length === 0}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
              {user ? (
                <Button 
                  size="sm" 
                  onClick={handleSaveDeck}
                  disabled={saving || deckLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : currentDeckId ? 'Update' : 'Save Deck'}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAuthDialogOpen(true)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In to Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Deck Info Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <Input
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="text-lg font-semibold border-0 bg-transparent px-0 focus-visible:ring-0"
                placeholder="Deck Name"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Format:</label>
                <Select value={deckFormat} onValueChange={(value: Format) => setDeckFormat(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Commander">Commander</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Pioneer">Pioneer</SelectItem>
                    <SelectItem value="Modern">Modern</SelectItem>
                    <SelectItem value="Historic">Historic</SelectItem>
                    <SelectItem value="Timeless">Timeless</SelectItem>
                    <SelectItem value="Pauper">Pauper</SelectItem>
                    <SelectItem value="Legacy">Legacy</SelectItem>
                    <SelectItem value="Vintage">Vintage</SelectItem>
                    <SelectItem value="Oathbreaker">Oathbreaker</SelectItem>
                    <SelectItem value="Alchemy">Alchemy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>AVG CMC: {deckStats.avgCMC.toFixed(1)}</span>
                <span>•</span>
                <span>Total: {totalMainboardCards}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Card Search Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Card Search</CardTitle>
                <CardDescription>
                  Search for Magic cards to add to your deck
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search cards..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 10).map((card) => (
                      <Card key={card.id} className="p-3 hover:bg-accent cursor-pointer">
                        <div className="flex items-center gap-3">
                          {card.image_uris?.small && (
                            <img 
                              src={card.image_uris.small} 
                              alt={card.name}
                              className="w-8 h-11 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleCardInspect(card as DeckCard)}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div 
                              className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors" 
                              onClick={() => handleCardInspect(card as DeckCard)}
                            >
                              {card.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {card.mana_cost} • {card.type_line}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleCardInspect(card as DeckCard)}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => addToMainboard(card)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => addToSideboard(card)}>
                              S
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => addToConsidering(card)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    searchQuery.length >= 3 && !isSearching && (
                      <div className="text-center text-muted-foreground py-4">
                        No cards found
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deck Lists */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="mainboard">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="mainboard">Mainboard ({totalMainboardCards})</TabsTrigger>
                <TabsTrigger value="sideboard">Sideboard ({totalSideboardCards})</TabsTrigger>
                <TabsTrigger value="considering">Considering ({totalConsideringCards})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mainboard">
                <Card>
                  <CardContent className="p-6">
                    <DeckSection
                      title="Mainboard"
                      cards={mainboard}
                      onRemove={(cardId) => removeFromDeck(cardId, 'mainboard')}
                      section="mainboard"
                      totalCards={totalMainboardCards}
                      onInspect={handleCardInspect}
                      onTransfer={transferCard}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sideboard">
                <Card>
                  <CardContent className="p-6">
                    <DeckSection
                      title="Sideboard"
                      cards={sideboard}
                      onRemove={(cardId) => removeFromDeck(cardId, 'sideboard')}
                      section="sideboard"
                      totalCards={totalSideboardCards}
                      onInspect={handleCardInspect}
                      onTransfer={transferCard}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="considering">
                <Card>
                  <CardContent className="p-6">
                    <DeckSection
                      title="Considering"
                      cards={considering}
                      onRemove={(cardId) => removeFromDeck(cardId, 'considering')}
                      section="considering"
                      totalCards={totalConsideringCards}
                      onInspect={handleCardInspect}
                      onTransfer={transferCard}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <ImportDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
      <DeckStatsModal 
        open={statsModalOpen} 
        onOpenChange={setStatsModalOpen}
        stats={deckStats}
        cards={mainboard}
      />
      <CardInspectionModal
        card={inspectedCard}
        open={cardInspectionOpen}
        onOpenChange={setCardInspectionOpen}
      />
    </div>
  )
}