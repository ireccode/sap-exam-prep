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
      profiles: {
        Row: {
          id: string
          created_at?: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          email: string | null
          website: string | null
          bio: string | null
          is_premium: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          website?: string | null
          bio?: string | null
          is_premium?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          website?: string | null
          bio?: string | null
          is_premium?: boolean
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
          price_id: string
          quantity: number
          cancel_at_period_end: boolean
          created_at: string
          current_period_start: string
          current_period_end: string
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
        }
        Insert: {
          id: string
          user_id: string
          status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
          price_id: string
          quantity?: number
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_start: string
          current_period_end: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
          price_id?: string
          quantity?: number
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_start?: string
          current_period_end?: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          created_at: string
          user_id: string
          stripe_customer_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          stripe_customer_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          stripe_customer_id?: string
        }
      }
      customer_subscriptions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          subscription_id: string
          price_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          subscription_id: string
          price_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          subscription_id?: string
          price_id?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
      }
      billing_history: {
        Row: {
          id: string
          created_at: string
          user_id: string
          amount: number
          currency: string
          status: string
          invoice_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          amount: number
          currency: string
          status: string
          invoice_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          amount?: number
          currency?: string
          status?: string
          invoice_url?: string | null
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
  }
} 