import { useState, useCallback } from 'react'
import { supabase, DeckCard, Format } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/types/types'

type Deck = Database['public']['Tables']['decks']['Row']
type DeckInsert = Database['public']['Tables']['decks']['Insert']

export function useDeckManagement() {
  const [userDecks, setUserDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const createDeck = useCallback(async (deckData: {
    name: string
    format: Format
    description?: string
    mainboard?: DeckCard[]
    sideboard?: DeckCard[]
    considering?: DeckCard[]
    isPublic?: boolean
  }) => {
    if (!user) {
      throw new Error('User must be logged in to create decks')
    }

    setLoading(true)
    setError(null)

    try {
      const insertData: DeckInsert = {
        name: deckData.name,
        format: deckData.format,
        description: deckData.description || null,
        mainboard: (deckData.mainboard || []) as any,
        sideboard: (deckData.sideboard || []) as any,
        considering: (deckData.considering || []) as any,
        is_public: deckData.isPublic ? 1 : 0,
        user_id: user.id,
        color_identity: [],
        tags: []
      }

      const { data, error } = await supabase
        .from('decks')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Refresh user decks
      await fetchUserDecks()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deck'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateDeck = useCallback(async (deckId: string, updates: Partial<{
    name: string
    format: Format
    description: string
    mainboard: DeckCard[]
    sideboard: DeckCard[]
    considering: DeckCard[]
    isPublic: boolean
  }>) => {
    if (!user) {
      throw new Error('User must be logged in to update decks')
    }

    setLoading(true)
    setError(null)

    try {
      const updateData: Partial<DeckInsert> = {}
      
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.format !== undefined) updateData.format = updates.format
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.mainboard !== undefined) updateData.mainboard = updates.mainboard as any
      if (updates.sideboard !== undefined) updateData.sideboard = updates.sideboard as any
      if (updates.considering !== undefined) updateData.considering = updates.considering as any
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic ? 1 : 0

      const { data, error } = await supabase
        .from('decks')
        .update(updateData)
        .eq('id', deckId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Refresh user decks
      await fetchUserDecks()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deck'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteDeck = useCallback(async (deckId: string) => {
    if (!user) {
      throw new Error('User must be logged in to delete decks')
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      // Refresh user decks
      await fetchUserDecks()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deck'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchUserDecks = useCallback(async () => {
    if (!user) {
      setUserDecks([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        throw error
      }

      setUserDecks(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch decks'
      setError(errorMessage)
      console.error('Fetch user decks error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchPublicDecks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('is_public', 1)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) {
        throw error
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch public decks'
      setError(errorMessage)
      console.error('Fetch public decks error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDeck = useCallback(async (deckId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('Deck not found')
      }

      // Check if user can access this deck (either owns it or it's public)
      if (data.user_id !== user?.id && data.is_public !== 1) {
        throw new Error('Access denied to private deck')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deck'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    userDecks,
    loading,
    error,
    createDeck,
    updateDeck,
    deleteDeck,
    fetchUserDecks,
    fetchPublicDecks,
    fetchDeck
  }
}