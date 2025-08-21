export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      decks: {
        Row: {
          id: string
          name: string
          format: string
          description: string | null
          mainboard: Json | null
          sideboard: Json | null
          considering: Json | null
          color_identity: string[] | null
          tags: string[] | null
          is_public: number | null
          user_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          format: string
          description?: string | null
          mainboard?: Json | null
          sideboard?: Json | null
          considering?: Json | null
          color_identity?: string[] | null
          tags?: string[] | null
          is_public?: number | null
          user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          format?: string
          description?: string | null
          mainboard?: Json | null
          sideboard?: Json | null
          considering?: Json | null
          color_identity?: string[] | null
          tags?: string[] | null
          is_public?: number | null
          user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}