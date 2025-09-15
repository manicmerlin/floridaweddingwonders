import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For admin operations (server-side only)
export const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should only be used server-side')
  }
  
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  )
}

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      venues: {
        Row: {
          id: string
          name: string
          description: string
          type: string
          location: string
          region: string
          capacity_min: number
          capacity_max: number
          price_range: string
          amenities: string[]
          images: string[]
          contact_phone: string
          contact_email: string
          contact_website?: string
          address_street: string
          address_city: string
          address_state: string
          address_zip: string
          coordinates_lat?: number
          coordinates_lng?: number
          created_at: string
          updated_at: string
          is_claimed: boolean
          claimed_by?: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          type: string
          location: string
          region: string
          capacity_min: number
          capacity_max: number
          price_range: string
          amenities: string[]
          images?: string[]
          contact_phone: string
          contact_email: string
          contact_website?: string
          address_street: string
          address_city: string
          address_state: string
          address_zip: string
          coordinates_lat?: number
          coordinates_lng?: number
          created_at?: string
          updated_at?: string
          is_claimed?: boolean
          claimed_by?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          type?: string
          location?: string
          region?: string
          capacity_min?: number
          capacity_max?: number
          price_range?: string
          amenities?: string[]
          images?: string[]
          contact_phone?: string
          contact_email?: string
          contact_website?: string
          address_street?: string
          address_city?: string
          address_state?: string
          address_zip?: string
          coordinates_lat?: number
          coordinates_lng?: number
          created_at?: string
          updated_at?: string
          is_claimed?: boolean
          claimed_by?: string
        }
      }
      venue_claims: {
        Row: {
          id: string
          venue_id: string
          user_email: string
          user_name: string
          user_phone: string
          message: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          user_email: string
          user_name: string
          user_phone: string
          message: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          user_email?: string
          user_name?: string
          user_phone?: string
          message?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      email_subscribers: {
        Row: {
          id: string
          email: string
          venue_name?: string
          is_venue_owner: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          venue_name?: string
          is_venue_owner?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          venue_name?: string
          is_venue_owner?: boolean
          created_at?: string
        }
      }
    }
  }
}
