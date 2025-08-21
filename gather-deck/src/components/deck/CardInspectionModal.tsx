import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, X } from 'lucide-react'
import { DeckCard, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface CardRuling {
  object: string
  oracle_id: string
  source: string
  published_at: string
  comment: string
}

interface CardInspectionModalProps {
  card: DeckCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formatManaSymbols = (manaCost: string) => {
  if (!manaCost) return null
  
  // Replace mana symbols with styled spans
  return manaCost.replace(/{([^}]+)}/g, (match, symbol) => {
    const symbolClass = `mana-symbol mana-${symbol.toLowerCase()}`
    return `<span class="${symbolClass}">{${symbol}}</span>`
  })
}

const getRarityColor = (rarity: string) => {
  const colors = {
    common: 'bg-gray-600',
    uncommon: 'bg-gray-400', 
    rare: 'bg-yellow-500',
    mythic: 'bg-orange-500',
    special: 'bg-purple-500'
  }
  return colors[rarity.toLowerCase() as keyof typeof colors] || 'bg-gray-500'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function CardInspectionModal({ card, open, onOpenChange }: CardInspectionModalProps) {
  const [rulings, setRulings] = useState<CardRuling[]>([])
  const [rulingsLoading, setRulingsLoading] = useState(false)
  const [rulingsError, setRulingsError] = useState('')
  const [activeTab, setActiveTab] = useState('details')

  const fetchRulings = async (cardId: string) => {
    setRulingsLoading(true)
    setRulingsError('')
    setRulings([])

    try {
      const { data, error } = await supabase.functions.invoke('scryfall-proxy', {
        body: {
          action: 'get_rulings',
          cardId: cardId
        }
      })

      if (error) {
        throw error
      }

      setRulings(data?.data || [])
    } catch (error: any) {
      console.error('Failed to fetch rulings:', error)
      setRulingsError('Failed to load rulings')
    } finally {
      setRulingsLoading(false)
    }
  }

  useEffect(() => {
    if (open && card && activeTab === 'rulings') {
      // Use card ID if available, otherwise try to fetch by name
      const cardIdentifier = card.id || card.name
      if (cardIdentifier) {
        fetchRulings(cardIdentifier)
      }
    }
  }, [open, card, activeTab])

  useEffect(() => {
    // Reset state when modal opens/closes
    if (!open) {
      setRulings([])
      setRulingsError('')
      setActiveTab('details')
    }
  }, [open])

  if (!card) return null

  const cardImage = card.image_uris?.large || card.image_uris?.normal || card.image_uris?.small || '/placeholder-card.png'
  const formattedManaCost = formatManaSymbols(card.mana_cost)
  const rarityColor = getRarityColor(card.rarity || 'common')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Pane: Card Image */}
          <div className="flex-shrink-0 w-full md:w-80 lg:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center p-4">
            <div className="relative max-w-full max-h-full">
              <img
                src={cardImage}
                alt={card.name}
                className="max-w-full max-h-[400px] md:max-h-[600px] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-card.png'
                }}
              />
            </div>
          </div>

          {/* Right Pane: Card Details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with close button - SINGLE CLOSE BUTTON ONLY */}
            <div className="flex justify-between items-start p-6 pb-4 border-b">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{card.name}</h2>
                {formattedManaCost && (
                  <div 
                    className="text-lg mb-2 flex items-center gap-1"
                    dangerouslySetInnerHTML={{ __html: formattedManaCost }}
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Tabs Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="rulings">Rulings</TabsTrigger>
                </TabsList>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <TabsContent value="details" className="mt-4 space-y-4">
                    {/* Type Line */}
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Type</h3>
                      <p className="text-sm">{card.type_line || 'Unknown'}</p>
                    </div>

                    {/* Oracle Text */}
                    {card.oracle_text && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Card Text</h3>
                        <div className="text-sm whitespace-pre-wrap bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-md max-h-40 overflow-y-auto">
                          {card.oracle_text}
                        </div>
                      </div>
                    )}

                    {/* Power/Toughness */}
                    {(card.power !== undefined || card.toughness !== undefined) && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Power/Toughness</h3>
                        <p className="text-sm font-mono">
                          {card.power || 0}/{card.toughness || 0}
                        </p>
                      </div>
                    )}

                    {/* Rarity */}
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Rarity</h3>
                      <Badge className={`${rarityColor} text-white`}>
                        {card.rarity ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) : 'Common'}
                      </Badge>
                    </div>

                    {/* Set Information */}
                    {(card.set_name || card.set) && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Set</h3>
                        <p className="text-sm">
                          {card.set_name || 'Unknown Set'}
                          {card.set && (
                            <span className="text-muted-foreground ml-2">({card.set.toUpperCase()})</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* CMC */}
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Mana Value (CMC)</h3>
                      <p className="text-sm">{card.cmc || 0}</p>
                    </div>

                    {/* Colors */}
                    {card.colors && card.colors.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Colors</h3>
                        <div className="flex gap-1">
                          {card.colors.map((color) => (
                            <Badge key={color} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color Identity */}
                    {card.color_identity && card.color_identity.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Color Identity</h3>
                        <div className="flex gap-1">
                          {card.color_identity.map((color) => (
                            <Badge key={color} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="rulings" className="mt-4">
                    {rulingsLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span>Loading rulings...</span>
                      </div>
                    )}

                    {rulingsError && (
                      <div className="text-center py-8">
                        <p className="text-destructive text-sm mb-2">{rulingsError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchRulings(card.id || card.name)}
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    {!rulingsLoading && !rulingsError && rulings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No rulings available for this card.</p>
                      </div>
                    )}

                    {!rulingsLoading && !rulingsError && rulings.length > 0 && (
                      <div className="space-y-4">
                        {rulings.map((ruling, index) => (
                          <Card key={index} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {ruling.source}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(ruling.published_at)}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{ruling.comment}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
