import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/types'

const supabaseUrl = 'https://rtcnojjykqiqtptflobk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Y25vamp5a3FpcXRwdGZsb2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NTc1NDgsImV4cCI6MjA3MTMzMzU0OH0.50FCVhGwObR6uipbVgYYjackVRdqkB06gBc3xmMXzjg'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// MTG Card interface from Scryfall API
export interface MTGCard {
  id: string
  name: string
  mana_cost: string
  cmc: number
  type_line: string
  oracle_text: string
  colors: string[]
  color_identity: string[]
  set: string
  set_name: string
  rarity: string
  power?: string
  toughness?: string
  image_uris?: {
    small?: string
    normal?: string
    large?: string
    art_crop?: string
  }
  prices: {
    usd?: string
    eur?: string
  }
}

// Deck Card with quantity
export interface DeckCard extends MTGCard {
  quantity: number
}

// MTG Format types
export type Format =
  | 'Commander'
  | 'Standard'
  | 'Pioneer'
  | 'Modern'
  | 'Historic'
  | 'Timeless'
  | 'Pauper'
  | 'Legacy'
  | 'Vintage'
  | 'Oathbreaker'
  | 'Alchemy'

// Deck statistics interface
export interface DeckStats {
  avgCMC: number
  creatures: number
  lands: number
  colorDistribution: { [color: string]: number }
  typeDistribution: { [type: string]: number }
}