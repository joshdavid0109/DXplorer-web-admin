export interface DateRange {
  start: string;
  end: string;
  remaining_slots: number;
}

export interface Database {
  public: {
    Tables: {
      packages: {
        Row: {
          id: number
          main_location: string
          price: number
          rating: number
          image_url: string
          itinerary: string
          side_locations: string[]
          inclusions: string[]
          available_dates: DateRange[]
          duration: number
          nights: number
          bookings: number
          revenue: number
          status: 'Active' | 'Inactive' | 'Draft'
          tour_type: 'Domestic' | 'International'
          created_at: string
          updated_at: string
        }
        Insert: {
          main_location: string
          price: number
          rating?: number
          image_url: string
          itinerary: string
          side_locations: string[]
          inclusions: string[]
          available_dates: DateRange[]
          duration: number
          nights: number
          bookings?: number
          revenue?: number
          status: 'Active' | 'Inactive' | 'Draft'
          tour_type: 'Domestic' | 'International'
        }
        Update: {
          id?: number
          main_location?: string
          price?: number
          rating?: number
          image_url?: string
          itinerary?: string
          side_locations?: string[]
          inclusions?: string[]
          available_dates?: DateRange[]
          duration?: number
          nights?: number
          bookings?: number
          revenue?: number
          status?: 'Active' | 'Inactive' | 'Draft'
          tour_type?: 'Domestic' | 'International'
          updated_at?: string
        }
      }
    }
  }
}