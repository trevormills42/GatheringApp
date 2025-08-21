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

export const searchCards = async (
  query: string,
  setSearchResults: (results: MTGCard[]) => void,
  setIsSearching: (loading: boolean) => void,
) => {
  if (!query.trim()) {
    setSearchResults([])
    return
  }

  if (query.length < 3) {
    setSearchResults([])
    return
  }

  setIsSearching(true)

  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&unique=cards`,
    )

    if (!response.ok) {
      if (response.status === 404) {
        // No cards found
        setSearchResults([])
        return
      }
      throw new Error(`Search failed: ${response.status}`)
    }

    const data = await response.json()

    // Transform Scryfall data to our MTGCard interface
    const transformedResults: MTGCard[] = data.data.slice(0, 20).map((card: any) => ({
      id: card.id,
      name: card.name,
      mana_cost: card.mana_cost || "",
      type_line: card.type_line,
      oracle_text: card.oracle_text || "",
      power: card.power,
      toughness: card.toughness,
      image_uris: card.image_uris || {
        small: "/generic-fantasy-card.png",
        normal: "/generic-fantasy-card.png",
      },
    }))

    setSearchResults(transformedResults)
  } catch (error) {
    console.error("Search failed:", error)
    setSearchResults([])
  } finally {
    setIsSearching(false)
  }
}
