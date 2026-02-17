export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          subdomain: string
          website_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          phone_number: string
          category_id: string
          firstname: string
          lastname: string
          home_address: string
          email: string
          pin: string
          access_level: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          category_id: string
          firstname?: string
          lastname?: string
          home_address?: string
          email?: string
          pin?: string
          access_level?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          category_id?: string
          firstname?: string
          lastname?: string
          home_address?: string
          email?: string
          pin?: string
          access_level?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
