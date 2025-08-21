import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { supabase, DeckCard, MTGCard, Format } from '@/lib/supabase'
import { Loader2, Upload, Link as LinkIcon } from 'lucide-react'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: (deckData: {
    name: string
    format: Format
    mainboard: DeckCard[]
    sideboard: DeckCard[]
    considering: DeckCard[]
  }) => void
}

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importText, setImportText] = useState('')
  const [activeTab, setActiveTab] = useState('url')

  const fetchCardDataFromScryfall = async (cardName: string): Promise<Partial<MTGCard> | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('scryfall-proxy', {
        body: {
          action: 'get_card',
          cardName: cardName
        }
      })

      if (error) {
        console.log('Scryfall lookup failed for:', cardName, error)
        return null
      }

      return data
    } catch (error) {
      console.log('Scryfall lookup failed for:', cardName, error)
      return null
    }
  }

  const parseArchidektData = async (deckData: any) => {
    console.log('Raw Archidekt deck data:', deckData)

    const mainboard: DeckCard[] = []
    const sideboard: DeckCard[] = []
    const considering: DeckCard[] = []

    if (deckData.cards) {
      for (const cardEntry of deckData.cards) {
        console.log('Processing card entry:', cardEntry)

        const card = cardEntry.card
        const cardName = card.oracleCard?.name || card.name || 'Unknown Card'

        let cardData = {
          type_line: card.oracleCard?.typeLine || card.typeLine || card.type_line || card.oracleCard?.type_line,
          mana_cost: card.oracleCard?.manaCost || card.manaCost || card.mana_cost || '',
          oracle_text: card.oracleCard?.oracleText || card.oracleText || card.oracle_text || '',
          power: card.oracleCard?.power || card.power,
          toughness: card.oracleCard?.toughness || card.toughness,
          image_uris: card.oracleCard?.image_uris || card.image_uris || {},
          colors: card.oracleCard?.colors || card.colors || [],
          color_identity: card.oracleCard?.color_identity || card.color_identity || [],
          set: card.oracleCard?.set || card.set || '',
          set_name: card.oracleCard?.set_name || card.set_name || '',
          rarity: card.oracleCard?.rarity || card.rarity || 'common',
          cmc: card.oracleCard?.cmc || card.cmc || 0,
          prices: card.oracleCard?.prices || card.prices || {}
        }

        // If type_line is missing or "Unknown", fetch from Scryfall
        if (!cardData.type_line || cardData.type_line === 'Unknown') {
          console.log('Fetching card data from Scryfall for:', cardName)
          const scryfallData = await fetchCardDataFromScryfall(cardName)
          if (scryfallData) {
            cardData = { ...cardData, ...scryfallData }
          }
        }

        const deckCard: DeckCard = {
          id: card.uid || card.id || Math.random().toString(),
          name: cardName,
          mana_cost: cardData.mana_cost,
          cmc: cardData.cmc,
          type_line: cardData.type_line || 'Unknown',
          oracle_text: cardData.oracle_text,
          colors: cardData.colors,
          color_identity: cardData.color_identity,
          set: cardData.set,
          set_name: cardData.set_name,
          rarity: cardData.rarity,
          power: cardData.power,
          toughness: cardData.toughness,
          quantity: cardEntry.quantity || 1,
          image_uris: {
            small: cardData.image_uris?.small || '/placeholder-card.png',
            normal: cardData.image_uris?.normal || '/placeholder-card.png'
          },
          prices: cardData.prices || {}
        }

        console.log('Processed card:', deckCard)

        if (cardEntry.categories && cardEntry.categories.includes('Sideboard')) {
          sideboard.push(deckCard)
        } else if (
          cardEntry.categories &&
          (cardEntry.categories.includes('Considering') || cardEntry.categories.includes('Maybeboard'))
        ) {
          considering.push(deckCard)
        } else {
          mainboard.push(deckCard)
        }
      }
    }

    console.log('Deck format from API:', deckData.format || deckData.deckFormat || deckData.gameFormat)

    let detectedFormat: Format = 'Standard'
    const formatValue = deckData.format || deckData.deckFormat || deckData.gameFormat
    if (formatValue) {
      const formatMap: { [key: string]: Format } = {
        // String format names
        commander: 'Commander',
        standard: 'Standard',
        pioneer: 'Pioneer',
        modern: 'Modern',
        historic: 'Historic',
        timeless: 'Timeless',
        pauper: 'Pauper',
        legacy: 'Legacy',
        vintage: 'Vintage',
        oathbreaker: 'Oathbreaker',
        alchemy: 'Alchemy',
        // Numeric format IDs from Archidekt API
        '1': 'Standard',
        '2': 'Modern',
        '3': 'Legacy',
        '4': 'Vintage',
        '5': 'Commander',
        '6': 'Pauper',
        '7': 'Pioneer',
        '8': 'Historic',
        '9': 'Alchemy',
        '10': 'Timeless',
        '11': 'Oathbreaker',
        '15': 'Pioneer'
      }

      const formatKey = typeof formatValue === 'string' ? formatValue.toLowerCase() : String(formatValue)
      detectedFormat = formatMap[formatKey] || 'Standard'
    }

    console.log('Final parsed data:', {
      name: deckData.name || 'Imported Archidekt Deck',
      format: detectedFormat,
      mainboard: mainboard.length,
      sideboard: sideboard.length,
      considering: considering.length
    })

    return {
      name: deckData.name || 'Imported Archidekt Deck',
      format: detectedFormat,
      mainboard,
      sideboard,
      considering
    }
  }

  const parseMoxfieldData = async (deckData: any) => {
    const mainboard: DeckCard[] = []
    const sideboard: DeckCard[] = []
    const considering: DeckCard[] = []

    const processCard = async (cardName: string, cardData: any): Promise<DeckCard> => {
      const card = cardData as any
      let imageUris = {
        small: card.card?.image_uris?.small || '/placeholder-card.png',
        normal: card.card?.image_uris?.normal || '/placeholder-card.png'
      }

      // If no image URIs available from Moxfield, fetch from Scryfall
      if (!card.card?.image_uris?.small || !card.card?.image_uris?.normal) {
        console.log('Missing image data for Moxfield card:', cardName, 'fetching from Scryfall')
        const scryfallData = await fetchCardDataFromScryfall(card.card?.name || cardName)
        if (scryfallData?.image_uris) {
          imageUris = {
            small: scryfallData.image_uris.small || imageUris.small,
            normal: scryfallData.image_uris.normal || imageUris.normal
          }
        }
      }

      const deckCard: DeckCard = {
        id: card.card?.id || Math.random().toString(),
        name: card.card?.name || cardName,
        mana_cost: card.card?.mana_cost || '',
        cmc: card.card?.cmc || 0,
        type_line: card.card?.type_line || 'Unknown',
        oracle_text: card.card?.oracle_text || '',
        colors: card.card?.colors || [],
        color_identity: card.card?.color_identity || [],
        set: card.card?.set || '',
        set_name: card.card?.set_name || '',
        rarity: card.card?.rarity || 'common',
        power: card.card?.power,
        toughness: card.card?.toughness,
        quantity: card.quantity || 1,
        image_uris: imageUris,
        prices: card.card?.prices || {}
      }
      return deckCard
    }

    // Parse mainboard
    if (deckData.mainboard) {
      for (const [cardName, cardData] of Object.entries(deckData.mainboard)) {
        const deckCard = await processCard(cardName, cardData)
        mainboard.push(deckCard)
      }
    }

    // Parse sideboard
    if (deckData.sideboard) {
      for (const [cardName, cardData] of Object.entries(deckData.sideboard)) {
        const deckCard = await processCard(cardName, cardData)
        sideboard.push(deckCard)
      }
    }

    // Parse considering (maybeboard in Moxfield)
    if (deckData.considering || deckData.maybeboard) {
      const consideringData = deckData.considering || deckData.maybeboard
      for (const [cardName, cardData] of Object.entries(consideringData)) {
        const deckCard = await processCard(cardName, cardData)
        considering.push(deckCard)
      }
    }

    let detectedFormat: Format = 'Standard'
    if (deckData.format) {
      const formatMap: { [key: string]: Format } = {
        commander: 'Commander',
        standard: 'Standard',
        pioneer: 'Pioneer',
        modern: 'Modern',
        historic: 'Historic',
        timeless: 'Timeless',
        pauper: 'Pauper',
        legacy: 'Legacy',
        vintage: 'Vintage',
        oathbreaker: 'Oathbreaker',
        alchemy: 'Alchemy'
      }
      detectedFormat = formatMap[deckData.format.toLowerCase()] || 'Standard'
    }

    return {
      name: deckData.name || 'Imported Moxfield Deck',
      format: detectedFormat,
      mainboard,
      sideboard,
      considering
    }
  }

  const parseTextDeckList = async (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim())
    const mainboard: DeckCard[] = []
    const sideboard: DeckCard[] = []
    const considering: DeckCard[] = []
    let currentSection = 'mainboard'

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (trimmedLine.toLowerCase().includes('sideboard') || trimmedLine.toLowerCase().includes('side board')) {
        currentSection = 'sideboard'
        continue
      }
      if (
        trimmedLine.toLowerCase().includes('considering') ||
        trimmedLine.toLowerCase().includes('maybeboard') ||
        trimmedLine.toLowerCase().includes('maybe board')
      ) {
        currentSection = 'considering'
        continue
      }

      const match = trimmedLine.match(/^(\d+)x?\s+(.+)$/i)
      if (match) {
        const quantity = parseInt(match[1])
        const cardName = match[2].trim()

        // Try to get card data from Scryfall
        const cardData = await fetchCardDataFromScryfall(cardName)

        const card: DeckCard = {
          id: Math.random().toString(),
          name: cardName,
          mana_cost: cardData?.mana_cost || '',
          cmc: cardData?.cmc || 0,
          type_line: cardData?.type_line || 'Unknown',
          oracle_text: cardData?.oracle_text || 'Imported card',
          colors: cardData?.colors || [],
          color_identity: cardData?.color_identity || [],
          set: cardData?.set || '',
          set_name: cardData?.set_name || '',
          rarity: cardData?.rarity || 'common',
          power: cardData?.power,
          toughness: cardData?.toughness,
          quantity,
          image_uris: {
            small: cardData?.image_uris?.small || '/placeholder-card.png',
            normal: cardData?.image_uris?.normal || '/placeholder-card.png'
          },
          prices: cardData?.prices || {}
        }

        if (currentSection === 'sideboard') {
          sideboard.push(card)
        } else if (currentSection === 'considering') {
          considering.push(card)
        } else {
          mainboard.push(card)
        }
      }
    }

    return { mainboard, sideboard, considering }
  }

  const importFromUrl = async () => {
    if (!importUrl.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      let platform = ''
      if (importUrl.includes('archidekt.com')) {
        platform = 'archidekt'
      } else if (importUrl.includes('moxfield.com')) {
        platform = 'moxfield'
      } else {
        throw new Error('Unsupported URL. Please use Archidekt or Moxfield URLs.')
      }

      const { data, error } = await supabase.functions.invoke('import-deck', {
        body: { url: importUrl, platform }
      })

      if (error) {
        throw error
      }

      let parsedData
      if (platform === 'archidekt') {
        parsedData = await parseArchidektData(data)
      } else {
        parsedData = await parseMoxfieldData(data)
      }

      onImportComplete(parsedData)
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error('Import error:', error)
      setError(error.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const importFromText = async () => {
    if (!importText.trim()) {
      setError('Please enter a deck list')
      return
    }

    setLoading(true)
    setError('')

    try {
      const parsedData = await parseTextDeckList(importText)
      
      onImportComplete({
        name: 'Imported Deck List',
        format: 'Standard',
        ...parsedData
      })
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error('Import error:', error)
      setError(error.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setImportUrl('')
    setImportText('')
    setError('')
    setActiveTab('url')
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Deck</DialogTitle>
          <DialogDescription>
            Import a deck from Archidekt, Moxfield, or from a text deck list.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">URL Import</TabsTrigger>
            <TabsTrigger value="text">Text Import</TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Import from URL
                </CardTitle>
                <CardDescription>
                  Paste a deck URL from Archidekt or Moxfield
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-url">Deck URL</Label>
                  <Input
                    id="import-url"
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://archidekt.com/decks/12345 or https://www.moxfield.com/decks/abc123"
                    disabled={loading}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Supported platforms:</strong></p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Archidekt: https://archidekt.com/decks/{'{'}id{'}'}</li>
                    <li>Moxfield: https://www.moxfield.com/decks/{'{'}id{'}'}</li>
                  </ul>
                </div>
                
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}
                
                <Button 
                  onClick={importFromUrl} 
                  className="w-full" 
                  disabled={loading || !importUrl.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Deck
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import from Text
                </CardTitle>
                <CardDescription>
                  Paste a deck list in text format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-text">Deck List</Label>
                  <Textarea
                    id="import-text"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`4 Lightning Bolt\n2 Counterspell\n24 Island\n\nSideboard:\n2 Negate\n1 Dispel\n\nConsidering:\n1 Force of Will`}
                    disabled={loading}
                    rows={8}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Format:</strong> Each line should be in format "4 Card Name" or "4x Card Name"</p>
                  <p><strong>Sections:</strong> Use "Sideboard:" and "Considering:" to separate sections</p>
                </div>
                
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}
                
                <Button 
                  onClick={importFromText} 
                  className="w-full" 
                  disabled={loading || !importText.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Deck
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}