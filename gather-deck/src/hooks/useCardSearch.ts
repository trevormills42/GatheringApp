import { useState, useCallback } from 'react'
import { supabase, MTGCard } from '@/lib/supabase'

export function useCardSearch() {
  const [searchResults, setSearchResults] = useState<MTGCard[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchCards = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke('scryfall-proxy', {
        body: {
          action: 'search',
          query: query.trim()
        }
      })

      if (error) {
        throw error
      }

      setSearchResults(data.data || [])
    } catch (err) {
      console.error('Card search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const getCard = useCallback(async (cardName: string): Promise<MTGCard | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('scryfall-proxy', {
        body: {
          action: 'get_card',
          cardName: cardName
        }
      })

      if (error) {
        throw error
      }

      return data
    } catch (err) {
      console.error('Get card error:', err)
      return null
    }
  }, [])

  return {
    searchResults,
    isSearching,
    error,
    searchCards,
    getCard
  }
}