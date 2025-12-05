export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          live_url: string | null
          github_url: string | null
          featured: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          live_url?: string | null
          github_url?: string | null
          featured?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          live_url?: string | null
          github_url?: string | null
          featured?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          twitter_url: string | null
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          twitter_url?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          twitter_url?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ideas: {
        Row: {
          id: string
          title: string
          description: string | null
          emoji: string | null
          category_id: string | null
          status: 'plan_to_do' | 'done' | 'dropped'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          emoji?: string | null
          category_id?: string | null
          status?: 'plan_to_do' | 'done' | 'dropped'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          emoji?: string | null
          category_id?: string | null
          status?: 'plan_to_do' | 'done' | 'dropped'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          dodo_payment_id: string | null
          dodo_session_id: string | null
          payer_email: string | null
          amount: number
          status: 'pending' | 'completed' | 'failed'
          project_id: string | null
          hall_of_fame_position: number | null
          idea_description: string | null
          project_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          dodo_payment_id?: string | null
          dodo_session_id?: string | null
          payer_email?: string | null
          amount: number
          status?: 'pending' | 'completed' | 'failed'
          project_id?: string | null
          hall_of_fame_position?: number | null
          idea_description?: string | null
          project_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          dodo_payment_id?: string | null
          dodo_session_id?: string | null
          payer_email?: string | null
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
          project_id?: string | null
          hall_of_fame_position?: number | null
          project_name?: string | null
          idea_description?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Project = Database['public']['Tables']['projects']['Row']
export type Idea = Database['public']['Tables']['ideas']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

