export interface DateRange {
  start: string;
  end: string;
  remaining_slots: number;
}

export interface Database {
  public: {
    Tables: {
      package_dates: {
        Row: {
          date_id: number;
          package_id: number;
          available_Date: any[];
        }
      }
      package_details: {
        Row: {
          detail_id: number;
          package_id: number;
          itinerary: string;
          side_locations: any[];
          inclusions: any[];
          image_url: string;
        }
      }
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