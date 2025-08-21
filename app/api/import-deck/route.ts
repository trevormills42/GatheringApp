import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, platform } = await request.json()

    if (platform === "archidekt") {
      // Extract deck ID from Archidekt URL
      const deckIdMatch = url.match(/\/decks\/(\d+)/)
      if (!deckIdMatch) {
        return NextResponse.json({ error: "Invalid Archidekt URL format" }, { status: 400 })
      }

      const deckId = deckIdMatch[1]
      const apiUrl = `https://archidekt.com/api/decks/${deckId}/`

      console.log("[v0] Fetching from Archidekt API:", apiUrl)

      try {
        const response = await fetch(apiUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "application/json",
            Referer: "https://archidekt.com/",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.log("[v0] Archidekt API error:", response.status, errorText)

          if (response.status === 404) {
            return NextResponse.json(
              {
                error: "Deck not found or is private. Only public Archidekt decks can be imported.",
              },
              { status: 404 },
            )
          }

          return NextResponse.json(
            {
              error: "Failed to fetch deck from Archidekt. Please ensure the deck is public and the URL is correct.",
            },
            { status: response.status },
          )
        }

        const deckData = await response.json()
        console.log("[v0] Successfully fetched Archidekt deck:", deckData.name || "Unknown name")
        return NextResponse.json(deckData)
      } catch (fetchError) {
        console.log("[v0] Archidekt fetch error:", fetchError)
        return NextResponse.json(
          {
            error: "Unable to connect to Archidekt. Please check the URL and try again.",
          },
          { status: 500 },
        )
      }
    }

    if (platform === "moxfield") {
      // Extract deck ID from Moxfield URL
      const deckIdMatch = url.match(/\/decks\/([^/]+)/)
      if (!deckIdMatch) {
        return NextResponse.json({ error: "Invalid Moxfield URL format" }, { status: 400 })
      }

      const deckId = deckIdMatch[1]
      const apiUrl = `https://api.moxfield.com/v2/decks/all/${deckId}`

      console.log("[v0] Fetching from Moxfield API:", apiUrl)

      try {
        const response = await fetch(apiUrl, {
          headers: {
            "User-Agent": "GatherDeck/1.0",
            Accept: "application/json",
          },
        })

        if (!response.ok) {
          console.log("[v0] Moxfield API error:", response.status, response.statusText)
          return NextResponse.json(
            {
              error: "Failed to fetch deck from Moxfield. Please ensure the deck is public and the URL is correct.",
            },
            { status: response.status },
          )
        }

        const deckData = await response.json()
        console.log("[v0] Successfully fetched Moxfield deck:", deckData.name)
        return NextResponse.json(deckData)
      } catch (fetchError) {
        console.log("[v0] Moxfield fetch error:", fetchError)
        return NextResponse.json(
          {
            error: "Unable to connect to Moxfield. Please check the URL and try again.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Import API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
