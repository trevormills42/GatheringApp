"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Minus, Library, ArrowLeft, Save, Download, Upload, ExternalLink, BarChart3 } from "lucide-react"
import Link from "next/link"
import { searchCards } from "@/utils/searchCards" // Declare the searchCards variable

interface MTGCard {
  id: string
  name: string
  mana_cost: string
  type_line: string
  oracle_text: string
  power?: string
  toughness?: string
  image_uris?: {
    small: string
    normal: string
  }
}

interface DeckCard extends MTGCard {
  quantity: number
}

type Format =
  | "Commander"
  | "Standard"
  | "Pioneer"
  | "Modern"
  | "Historic"
  | "Timeless"
  | "Pauper"
  | "Legacy"
  | "Vintage"
  | "Oathbreaker"
  | "Alchemy"

interface DeckStats {
  avgCMC: number
  creatures: number
  lands: number
  colorDistribution: { [color: string]: number }
  typeDistribution: { [type: string]: number }
}

export default function DeckBuilderPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deckName, setDeckName] = useState("Untitled Deck")
  const [deckFormat, setDeckFormat] = useState<Format>("Standard")
  const [mainboard, setMainboard] = useState<DeckCard[]>([])
  const [sideboard, setSideboard] = useState<DeckCard[]>([])
  const [considering, setConsidering] = useState<DeckCard[]>([])
  const [searchResults, setSearchResults] = useState<MTGCard[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [importText, setImportText] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState("")

  const calculateDeckStats = (cards: DeckCard[]): DeckStats => {
    console.log("[v0] Calculating stats for cards:", cards)

    let totalCMC = 0
    let nonLandCards = 0
    let creatures = 0
    let lands = 0
    const colorDistribution: { [color: string]: number } = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 }
    const typeDistribution: { [type: string]: number } = {
      Creature: 0,
      Instant: 0,
      Sorcery: 0,
      Enchantment: 0,
      Artifact: 0,
      Planeswalker: 0,
      Land: 0,
    }

    cards.forEach((card) => {
      console.log("[v0] Processing card for stats:", {
        name: card.name,
        mana_cost: card.mana_cost,
        type_line: card.type_line,
        quantity: card.quantity,
      })

      const quantity = card.quantity
      const isLand = card.type_line.toLowerCase().includes("land")

      // Count card types
      if (card.type_line.toLowerCase().includes("creature")) {
        creatures += quantity
        typeDistribution.Creature += quantity
      } else if (card.type_line.toLowerCase().includes("instant")) {
        typeDistribution.Instant += quantity
      } else if (card.type_line.toLowerCase().includes("sorcery")) {
        typeDistribution.Sorcery += quantity
      } else if (card.type_line.toLowerCase().includes("enchantment")) {
        typeDistribution.Enchantment += quantity
      } else if (card.type_line.toLowerCase().includes("artifact")) {
        typeDistribution.Artifact += quantity
      } else if (card.type_line.toLowerCase().includes("planeswalker")) {
        typeDistribution.Planeswalker += quantity
      }

      if (isLand) {
        lands += quantity
        typeDistribution.Land += quantity
      } else {
        // Calculate CMC for non-lands
        const cmc = parseCMC(card.mana_cost)
        totalCMC += cmc * quantity
        nonLandCards += quantity

        // Count color distribution
        const manaCost = card.mana_cost
        const colors = ["W", "U", "B", "R", "G"]
        colors.forEach((color) => {
          const matches = manaCost.match(new RegExp(`{[^}]*${color}[^}]*}`, "g"))
          if (matches) {
            colorDistribution[color] += matches.length * quantity
          }
        })

        // Count colorless mana
        const colorlessMatches = manaCost.match(/{[0-9]+}/g)
        if (colorlessMatches) {
          colorlessMatches.forEach((match) => {
            const num = Number.parseInt(match.replace(/[{}]/g, ""))
            colorDistribution.C += num * quantity
          })
        }
      }
    })

    const finalStats = {
      avgCMC: nonLandCards > 0 ? totalCMC / nonLandCards : 0,
      creatures,
      lands,
      colorDistribution,
      typeDistribution,
    }

    console.log("[v0] Final calculated stats:", finalStats)

    return finalStats
  }

  const parseCMC = (manaCost: string): number => {
    if (!manaCost) return 0

    let cmc = 0
    const matches = manaCost.match(/{[^}]+}/g)

    if (matches) {
      matches.forEach((match) => {
        const content = match.replace(/[{}]/g, "")
        if (/^\d+$/.test(content)) {
          cmc += Number.parseInt(content)
        } else {
          // Each colored mana symbol adds 1 to CMC
          cmc += 1
        }
      })
    }

    return cmc
  }

  const deckStats = calculateDeckStats(mainboard)

  const addToMainboard = (card: MTGCard) => {
    setMainboard((prev) => {
      const existing = prev.find((c) => c.id === card.id)
      if (existing) {
        return prev.map((c) => (c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c))
      }
      return [...prev, { ...card, quantity: 1 }]
    })
  }

  const addToSideboard = (card: MTGCard) => {
    setSideboard((prev) => {
      const existing = prev.find((c) => c.id === card.id)
      if (existing) {
        return prev.map((c) => (c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c))
      }
      return [...prev, { ...card, quantity: 1 }]
    })
  }

  const addToConsidering = (card: MTGCard) => {
    setConsidering((prev) => {
      const existing = prev.find((c) => c.id === card.id)
      if (existing) {
        return prev.map((c) => (c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c))
      }
      return [...prev, { ...card, quantity: 1 }]
    })
  }

  const removeFromDeck = (cardId: string, fromSideboard = false, fromConsidering = false) => {
    const setter = fromConsidering ? setConsidering : fromSideboard ? setSideboard : setMainboard
    setter((prev) => {
      const existing = prev.find((c) => c.id === cardId)
      if (existing && existing.quantity > 1) {
        return prev.map((c) => (c.id === cardId ? { ...c, quantity: c.quantity - 1 } : c))
      }
      return prev.filter((c) => c.id !== cardId)
    })
  }

  const totalMainboardCards = mainboard.reduce((sum, card) => sum + card.quantity, 0)
  const totalSideboardCards = sideboard.reduce((sum, card) => sum + card.quantity, 0)
  const totalConsideringCards = considering.reduce((sum, card) => sum + card.quantity, 0)

  const fetchCardDataFromScryfall = async (cardName: string) => {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`)
      if (response.ok) {
        const cardData = await response.json()
        return {
          type_line: cardData.type_line || "Unknown",
          mana_cost: cardData.mana_cost || "",
          oracle_text: cardData.oracle_text || "",
          power: cardData.power,
          toughness: cardData.toughness,
          image_uris: cardData.image_uris || {},
        }
      }
    } catch (error) {
      console.log("[v0] Scryfall lookup failed for:", cardName, error)
    }
    return null
  }

  const parseArchidektData = async (deckData: any) => {
    console.log("[v0] Raw Archidekt deck data:", deckData)

    const mainboard: DeckCard[] = []
    const sideboard: DeckCard[] = []
    const considering: DeckCard[] = []

    if (deckData.cards) {
      for (const cardEntry of deckData.cards) {
        console.log("[v0] Processing card entry:", cardEntry)

        const card = cardEntry.card
        const cardName = card.oracleCard?.name || card.name || "Unknown Card"

        let cardData = {
          type_line: card.oracleCard?.typeLine || card.typeLine || card.type_line || card.oracleCard?.type_line,
          mana_cost: card.oracleCard?.manaCost || card.manaCost || card.mana_cost || "",
          oracle_text: card.oracleCard?.oracleText || card.oracleText || card.oracle_text || "",
          power: card.oracleCard?.power || card.power,
          toughness: card.oracleCard?.toughness || card.toughness,
          image_uris: card.oracleCard?.image_uris || card.image_uris || {},
        }

        // If type_line is missing or "Unknown", fetch from Scryfall
        if (!cardData.type_line || cardData.type_line === "Unknown") {
          console.log("[v0] Fetching card data from Scryfall for:", cardName)
          const scryfallData = await fetchCardDataFromScryfall(cardName)
          if (scryfallData) {
            cardData = { ...cardData, ...scryfallData }
          }
        }

        const deckCard: DeckCard = {
          id: card.uid || card.id || Math.random().toString(),
          name: cardName,
          mana_cost: cardData.mana_cost,
          type_line: cardData.type_line || "Unknown",
          oracle_text: cardData.oracle_text,
          power: cardData.power,
          toughness: cardData.toughness,
          quantity: cardEntry.quantity || 1,
          image_uris: {
            small: cardData.image_uris?.small || "/generic-fantasy-card.png",
            normal: cardData.image_uris?.normal || "/generic-fantasy-card.png",
          },
        }

        console.log("[v0] Processed card:", deckCard)

        if (cardEntry.categories && cardEntry.categories.includes("Sideboard")) {
          sideboard.push(deckCard)
        } else if (
          cardEntry.categories &&
          (cardEntry.categories.includes("Considering") || cardEntry.categories.includes("Maybeboard"))
        ) {
          considering.push(deckCard)
        } else {
          mainboard.push(deckCard)
        }
      }
    }

    console.log("[v0] Deck format from API:", deckData.format || deckData.deckFormat || deckData.gameFormat)

    let detectedFormat: Format = "Standard"
    const formatValue = deckData.format || deckData.deckFormat || deckData.gameFormat
    if (formatValue) {
      const formatMap: { [key: string]: Format } = {
        // String format names
        commander: "Commander",
        standard: "Standard",
        pioneer: "Pioneer",
        modern: "Modern",
        historic: "Historic",
        timeless: "Timeless",
        pauper: "Pauper",
        legacy: "Legacy",
        vintage: "Vintage",
        oathbreaker: "Oathbreaker",
        alchemy: "Alchemy",
        // Numeric format IDs from Archidekt API
        "1": "Standard",
        "2": "Modern",
        "3": "Legacy",
        "4": "Vintage",
        "5": "Commander",
        "6": "Pauper",
        "7": "Pioneer",
        "8": "Historic",
        "9": "Alchemy",
        "10": "Timeless",
        "11": "Oathbreaker",
        "15": "Pioneer", // Based on user's deck showing 15 for Pioneer format
      }

      // Convert to string for lookup, handle both string and numeric format values
      const formatKey = typeof formatValue === "string" ? formatValue.toLowerCase() : String(formatValue)
      detectedFormat = formatMap[formatKey] || "Standard"
    }

    console.log("[v0] Final parsed data:", {
      name: deckData.name || "Imported Archidekt Deck",
      format: detectedFormat,
      mainboard: mainboard.length,
      sideboard: sideboard.length,
      considering: considering.length,
    })

    return {
      name: deckData.name || "Imported Archidekt Deck",
      format: detectedFormat,
      mainboard,
      sideboard,
      considering,
    }
  }

  const parseMoxfieldData = (deckData: any) => {
    const mainboard: DeckCard[] = []
    const sideboard: DeckCard[] = []
    const considering: DeckCard[] = []

    // Parse mainboard
    if (deckData.mainboard) {
      for (const [cardName, cardData] of Object.entries(deckData.mainboard)) {
        const card = cardData as any
        const deckCard: DeckCard = {
          id: card.card?.id || Math.random().toString(),
          name: card.card?.name || cardName,
          mana_cost: card.card?.mana_cost || "",
          type_line: card.card?.type_line || "Unknown",
          oracle_text: card.card?.oracle_text || "",
          power: card.card?.power,
          toughness: card.card?.toughness,
          quantity: card.quantity || 1,
          image_uris: {
            small: card.card?.image_uris?.small || "/generic-fantasy-card.png",
            normal: card.card?.image_uris?.normal || "/generic-fantasy-card.png",
          },
        }
        mainboard.push(deckCard)
      }
    }

    // Parse sideboard
    if (deckData.sideboard) {
      for (const [cardName, cardData] of Object.entries(deckData.sideboard)) {
        const card = cardData as any
        const deckCard: DeckCard = {
          id: card.card?.id || Math.random().toString(),
          name: card.card?.name || cardName,
          mana_cost: card.card?.mana_cost || "",
          type_line: card.card?.type_line || "Unknown",
          oracle_text: card.card?.oracle_text || "",
          power: card.card?.power,
          toughness: card.card?.toughness,
          quantity: card.quantity || 1,
          image_uris: {
            small: card.card?.image_uris?.small || "/generic-fantasy-card.png",
            normal: card.card?.image_uris?.normal || "/generic-fantasy-card.png",
          },
        }
        sideboard.push(deckCard)
      }
    }

    // Parse considering
    if (deckData.considering) {
      for (const [cardName, cardData] of Object.entries(deckData.considering)) {
        const card = cardData as any
        const deckCard: DeckCard = {
          id: card.card?.id || Math.random().toString(),
          name: card.card?.name || cardName,
          mana_cost: card.card?.mana_cost || "",
          type_line: card.card?.type_line || "Unknown",
          oracle_text: card.card?.oracle_text || "",
          power: card.card?.power,
          toughness: card.card?.toughness,
          quantity: card.quantity || 1,
          image_uris: {
            small: card.card?.image_uris?.small || "/generic-fantasy-card.png",
            normal: card.card?.image_uris?.normal || "/generic-fantasy-card.png",
          },
        }
        considering.push(deckCard)
      }
    }

    let detectedFormat: Format = "Standard"
    if (deckData.format) {
      const formatMap: { [key: string]: Format } = {
        commander: "Commander",
        standard: "Standard",
        pioneer: "Pioneer",
        modern: "Modern",
        historic: "Historic",
        timeless: "Timeless",
        pauper: "Pauper",
        legacy: "Legacy",
        vintage: "Vintage",
        oathbreaker: "Oathbreaker",
        alchemy: "Alchemy",
      }
      detectedFormat = formatMap[deckData.format.toLowerCase()] || "Standard"
    }

    return {
      name: deckData.name || "Imported Moxfield Deck",
      format: detectedFormat,
      mainboard,
      sideboard,
      considering,
    }
  }

  const parseTextDeckList = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    const mainboard: DeckCard[] = []
    const sideboard: DeckCard[] = []
    const considering: DeckCard[] = []
    let currentSection = "mainboard"

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (trimmedLine.toLowerCase().includes("sideboard") || trimmedLine.toLowerCase().includes("side board")) {
        currentSection = "sideboard"
        continue
      }
      if (
        trimmedLine.toLowerCase().includes("considering") ||
        trimmedLine.toLowerCase().includes("maybeboard") ||
        trimmedLine.toLowerCase().includes("maybe board")
      ) {
        currentSection = "considering"
        continue
      }

      const match = trimmedLine.match(/^(\d+)x?\s+(.+)$/i)
      if (match) {
        const quantity = Number.parseInt(match[1])
        const cardName = match[2].trim()

        const card: DeckCard = {
          id: Math.random().toString(),
          name: cardName,
          mana_cost: "{?}",
          type_line: "Unknown",
          oracle_text: "Imported card",
          quantity,
          image_uris: {
            small: "/generic-fantasy-card.png",
            normal: "/generic-fantasy-card.png",
          },
        }

        if (currentSection === "sideboard") {
          sideboard.push(card)
        } else if (currentSection === "considering") {
          considering.push(card)
        } else {
          mainboard.push(card)
        }
      }
    }

    return { mainboard, sideboard, considering }
  }

  const importFromArchidekt = async (url: string) => {
    try {
      const deckId = url.match(/\/decks\/(\d+)/)?.[1]
      if (!deckId) throw new Error("Invalid Archidekt URL")

      const response = await fetch("/api/import-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, platform: "archidekt" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch deck")
      }

      const deckData = await response.json()
      const parsedData = await parseArchidektData(deckData)

      if (parsedData) {
        setDeckName(parsedData.name || "Imported Deck")
        setMainboard(parsedData.mainboard || [])
        setSideboard(parsedData.sideboard || [])
        setConsidering(parsedData.considering || [])
        if (parsedData.format) {
          setDeckFormat(parsedData.format)
        }
        setImportDialogOpen(false)
        setImportUrl("")
      }
    } catch (error) {
      console.error("[v0] Import error:", error)
      setImportError(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const importFromMoxfield = async (url: string) => {
    try {
      const response = await fetch("/api/import-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, platform: "moxfield" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch deck")
      }

      const deckData = await response.json()
      const parsedData = parseMoxfieldData(deckData)

      if (parsedData) {
        setDeckName(parsedData.name || "Imported Deck")
        setMainboard(parsedData.mainboard || [])
        setSideboard(parsedData.sideboard || [])
        setConsidering(parsedData.considering || [])
        if (parsedData.format) {
          setDeckFormat(parsedData.format)
        }
        setImportDialogOpen(false)
        setImportUrl("")
      }
    } catch (error) {
      console.error("[v0] Import error:", error)
      setImportError(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const importFromUrl = async () => {
    if (!importUrl.trim()) return

    setIsImporting(true)
    try {
      if (importUrl.includes("archidekt.com")) {
        await importFromArchidekt(importUrl)
      } else if (importUrl.includes("moxfield.com")) {
        await importFromMoxfield(importUrl)
      } else {
        throw new Error("Unsupported URL. Please use Archidekt or Moxfield URLs.")
      }
    } catch (error: any) {
      console.error("[v0] Import error:", error)
      setImportError(`Import failed: ${error.message}`)
    } finally {
      setIsImporting(false)
    }
  }

  const importFromText = () => {
    if (!importText.trim()) return

    setIsImporting(true)
    try {
      const deckData = parseTextDeckList(importText)
      if (deckData) {
        setMainboard(deckData.mainboard || [])
        setSideboard(deckData.sideboard || [])
        setConsidering(deckData.considering || [])
        setImportDialogOpen(false)
        setImportText("")
      }
    } catch (error) {
      console.error("Text import failed:", error)
      alert("Failed to parse deck list. Please check the format and try again.")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <Library className="w-4 h-4 text-primary-foreground" />
                </div>
                <Input
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
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

              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Import Deck</DialogTitle>
                    <DialogDescription>
                      Import a deck from Archidekt, Moxfield, or paste a text deck list.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">URL Import</TabsTrigger>
                      <TabsTrigger value="text">Text Import</TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Deck URL</label>
                        <Input
                          placeholder="https://archidekt.com/decks/... or https://moxfield.com/decks/..."
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                        />
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <ExternalLink className="w-3 h-3" />
                          <span>Supports Archidekt and Moxfield URLs</span>
                        </div>
                      </div>
                      <Button onClick={importFromUrl} disabled={!importUrl.trim() || isImporting} className="w-full">
                        {isImporting ? "Importing..." : "Import from URL"}
                      </Button>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Deck List</label>
                        <Textarea
                          placeholder={`4x Lightning Bolt\n2x Counterspell\n\nSideboard:\n2x Lightning Bolt\n\nConsidering:\n1x Serra Angel`}
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          rows={8}
                        />
                        <div className="text-xs text-muted-foreground">
                          Format: "4x Card Name" or "4 Card Name". Use "Sideboard:" and "Considering:" to separate
                          sections.
                        </div>
                      </div>
                      <Button onClick={importFromText} disabled={!importText.trim() || isImporting} className="w-full">
                        {isImporting ? "Importing..." : "Import from Text"}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Stats
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Deck Statistics</DialogTitle>
                    <DialogDescription>Detailed analysis of your {deckFormat} deck</DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Color Distribution</h4>
                        <div className="space-y-3">
                          {Object.entries(deckStats.colorDistribution).map(([color, count]) => {
                            const colorNames = {
                              W: "White",
                              U: "Blue",
                              B: "Black",
                              R: "Red",
                              G: "Green",
                              C: "Colorless",
                            }

                            const colorClasses = {
                              W: "bg-yellow-100 border-yellow-300",
                              U: "bg-blue-100 border-blue-300",
                              B: "bg-gray-800 border-gray-600",
                              R: "bg-red-100 border-red-300",
                              G: "bg-green-100 border-green-300",
                              C: "bg-gray-100 border-gray-300",
                            }

                            const totalColors = Object.values(deckStats.colorDistribution).reduce(
                              (sum, c) => sum + c,
                              0,
                            )
                            const percentage = totalColors > 0 ? Math.round((count / totalColors) * 100) : 0

                            return count > 0 ? (
                              <div key={color} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{colorNames[color as keyof typeof colorNames]}</span>
                                  <span>{percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color as keyof typeof colorClasses]}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Card Types</h4>
                        <div className="space-y-1">
                          {Object.entries(deckStats.typeDistribution).map(([type, count]) =>
                            count > 0 ? (
                              <div key={type} className="flex justify-between text-sm">
                                <span>{type}</span>
                                <span>{count}</span>
                              </div>
                            ) : null,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Card Search
                </CardTitle>
                <CardDescription>Search for Magic cards to add to your deck</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search cards..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchCards(e.target.value, setSearchResults, setIsSearching)
                    }}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isSearching && <div className="text-center py-4 text-muted-foreground">Searching...</div>}

                  {searchResults.map((card) => (
                    <Card key={card.id} className="p-3">
                      <div className="flex items-start space-x-3">
                        <img
                          src={card.image_uris?.small || "/placeholder.svg"}
                          alt={card.name}
                          className="w-12 h-16 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{card.name}</h4>
                          <p className="text-xs text-muted-foreground">{card.mana_cost}</p>
                          <p className="text-xs text-muted-foreground">{card.type_line}</p>
                          {card.power && card.toughness && (
                            <p className="text-xs text-muted-foreground">
                              {card.power}/{card.toughness}
                            </p>
                          )}
                          <div className="flex space-x-1 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs bg-transparent"
                              onClick={() => addToMainboard(card)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Main
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs bg-transparent"
                              onClick={() => addToSideboard(card)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Side
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs bg-transparent"
                              onClick={() => addToConsidering(card)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Maybe
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {searchQuery && !isSearching && searchResults.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">No cards found</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Deck Stats</CardTitle>
                <CardDescription>{deckFormat} format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg. CMC</span>
                  <Badge variant="secondary">{deckStats.avgCMC.toFixed(1)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Creatures</span>
                  <Badge variant="secondary">{deckStats.creatures}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Lands</span>
                  <Badge variant="secondary">{deckStats.lands}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => setStatsDialogOpen(true)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Stats
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="mainboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="mainboard">Mainboard ({totalMainboardCards})</TabsTrigger>
                <TabsTrigger value="sideboard">Sideboard ({totalSideboardCards})</TabsTrigger>
                <TabsTrigger value="considering">Considering ({totalConsideringCards})</TabsTrigger>
              </TabsList>

              <TabsContent value="mainboard" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mainboard</CardTitle>
                    <CardDescription>Your main deck cards ({totalMainboardCards}/60 recommended)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mainboard.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No cards in mainboard. Search and add cards to get started.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {mainboard.map((card) => (
                          <div key={card.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary">{card.quantity}x</Badge>
                              <div>
                                <span className="font-medium">{card.name}</span>
                                <span className="text-muted-foreground ml-2">{card.mana_cost}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 bg-transparent"
                                onClick={() => addToMainboard(card)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 bg-transparent"
                                onClick={() => removeFromDeck(card.id)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sideboard" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sideboard</CardTitle>
                    <CardDescription>Your sideboard cards ({totalSideboardCards}/15 recommended)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sideboard.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No cards in sideboard. Add cards for post-game adjustments.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sideboard.map((card) => (
                          <div key={card.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary">{card.quantity}x</Badge>
                              <div>
                                <span className="font-medium">{card.name}</span>
                                <span className="text-muted-foreground ml-2">{card.mana_cost}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 bg-transparent"
                                onClick={() => addToSideboard(card)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 bg-transparent"
                                onClick={() => removeFromDeck(card.id, true)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="considering" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Considering</CardTitle>
                    <CardDescription>
                      Cards you're thinking about adding ({totalConsideringCards} cards)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {considering.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No cards being considered. Add cards you're thinking about including.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {considering.map((card) => (
                          <div key={card.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary">{card.quantity}x</Badge>
                              <div>
                                <span className="font-medium">{card.name}</span>
                                <span className="text-muted-foreground ml-2">{card.mana_cost}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 bg-transparent"
                                onClick={() => addToConsidering(card)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 bg-transparent"
                                onClick={() => removeFromDeck(card.id, false, true)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
