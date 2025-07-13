import { supabase } from '../lib/supabase'
import type { Database } from '../lib/types'

type Package = Database['public']['Tables']['packages']['Row']
type PackageInsert = Database['public']['Tables']['packages']['Insert']
type PackageUpdate = Database['public']['Tables']['packages']['Update']
type PackageDate = Database['public']['Tables']['package_dates']['Row']
type PackageDetail = Database['public']['Tables']['package_details']['Row']

// Extended package type with joined data
export interface ExtendedPackage extends Package {
  available_dates: PackageDate[]
  package_details: PackageDetail | null
}

export const packagesService = {
   // Get all packages with related data
  getPackages: async (): Promise<ExtendedPackage[]> => {
    try {
      // First, let's test if package_details table has data
      const { data: testDetails, error: testError } = await supabase
        .from('package_details')
        .select('*')
        .limit(5)
      
      console.log('Test package_details data:', testDetails)
      console.log('Test error:', testError)

      // Now fetch packages with joins
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          package_dates (
            date_id,
            package_id,
            available_Date
          ),
          package_details (
            detail_id,
            package_id,
            itinerary,
            side_locations,
            inclusions
          )
        `)

      console.log('Fetched packages raw data:', JSON.stringify(data, null, 2))
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to fetch packages: ${error.message}`)
      }
      
      // Transform the data to match the expected format
      const transformedData = (data || []).map(pkg => {
        console.log('Processing package ID:', pkg.package_id)
        console.log('Package details array:', pkg.package_details)
        
        if (pkg.package_details && pkg.package_details.length > 0) {
          console.log('First package detail:', pkg.package_details[0])
          console.log('Itinerary:', pkg.package_details[0].itinerary)
          console.log('Side locations:', pkg.package_details[0].side_locations)
          console.log('Inclusions:', pkg.package_details[0].inclusions)
        }
        
        return {
          ...pkg,
          available_dates: pkg.package_dates || [],
          package_details: pkg.package_details && pkg.package_details.length > 0 
            ? pkg.package_details[0] 
            : null
        }
      })
      
      return transformedData
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  // Alternative method - fetch separately and join manually
  getPackagesAlternative: async (): Promise<ExtendedPackage[]> => {
    try {
      // Fetch packages
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select('*')

      if (packagesError) {
        throw new Error(`Failed to fetch packages: ${packagesError.message}`)
      }

      // Fetch package details
      const { data: packageDetails, error: detailsError } = await supabase
        .from('package_details')
        .select('*')

      if (detailsError) {
        throw new Error(`Failed to fetch package details: ${detailsError.message}`)
      }

      // Fetch package dates
      const { data: packageDates, error: datesError } = await supabase
        .from('package_dates')
        .select('*')

      if (datesError) {
        throw new Error(`Failed to fetch package dates: ${datesError.message}`)
      }

      console.log('Separate fetch - Packages:', packages)
      console.log('Separate fetch - Package Details:', packageDetails)
      console.log('Separate fetch - Package Dates:', packageDates)

      // Manually join the data
      const transformedData = packages.map(pkg => {
        const relatedDetails = packageDetails.filter(detail => detail.package_id === pkg.package_id)
        const relatedDates = packageDates.filter(date => date.package_id === pkg.package_id)

        return {
          ...pkg,
          available_dates: relatedDates,
          package_details: relatedDetails.length > 0 ? relatedDetails[0] : null
        }
      })

      return transformedData
    } catch (error) {
      console.error('Alternative service error:', error)
      throw error
    }
  },

  // Create a new package with related data
  createPackage: async (packageData: any): Promise<ExtendedPackage> => {
    try {
      // First create the main package
      const { data: packageResult, error: packageError } = await supabase
        .from('packages')
        .insert([{
          destination: packageData.destination,
          price: packageData.price,
          image_url: packageData.image_url,
          duration: packageData.duration,
          nights: packageData.nights,
          status: packageData.status,
          tour_type: packageData.tour_type,
          rating: 0,
          bookings: 0,
          revenue: 0
        }])
        .select()
        .single()
      
      if (packageError) {
        console.error('Package creation error:', packageError)
        throw new Error(`Failed to create package: ${packageError.message}`)
      }

      // Create package details if provided
      if (packageData.itinerary || packageData.side_locations || packageData.inclusions) {
        const { error: detailsError } = await supabase
          .from('package_details')
          .insert([{
            package_id: packageResult.id,
            itinerary: packageData.itinerary || '',
            side_locations: packageData.side_locations || [],
            inclusions: packageData.inclusions || []
          }])
        
        if (detailsError) {
          console.error('Package details creation error:', detailsError)
          // Don't throw here, just log the error
        }
      }

      // Create package dates if provided
      if (packageData.available_dates && packageData.available_dates.length > 0) {
        const dateInserts = packageData.available_dates.map((date: any) => ({
          package_id: packageResult.id,
          available_date: date // Store the entire date object as JSONB
        }))

        const { error: datesError } = await supabase
          .from('package_dates')
          .insert(dateInserts)
        
        if (datesError) {
          console.error('Package dates creation error:', datesError)
          // Don't throw here, just log the error
        }
      }

      // Fetch the complete package with related data
      const { data: completePackage, error: fetchError } = await supabase
        .from('packages')
        .select(`
          *,
          package_dates (
            date_id,
            package_id,
            available_Date
        ),
          package_details (
            detail_id,
            package_id,
            itinerary,
            side_locations,
            inclusions
          )
        `)
        .eq('id', packageResult.id)
        .single()

      if (fetchError) {
        console.error('Fetch complete package error:', fetchError)
        throw new Error(`Failed to fetch created package: ${fetchError.message}`)
      }

      return {
        ...completePackage,
        available_dates: completePackage.package_dates || [],
        package_details: completePackage.package_details ? completePackage.package_details[0] : null
      }
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  // Update a package with related data
  updatePackage: async (id: number, packageData: any): Promise<ExtendedPackage> => {
    try {
      // Update main package
      const { data: packageResult, error: packageError } = await supabase
        .from('packages')
        .update({
          destination: packageData.destination,
          price: packageData.price,
          image_url: packageData.image_url,
          duration: packageData.duration,
          nights: packageData.nights,
          status: packageData.status,
          tour_type: packageData.tour_type
        })
        .eq('id', id)
        .select()
        .single()
      
      if (packageError) {
        console.error('Package update error:', packageError)
        throw new Error(`Failed to update package: ${packageError.message}`)
      }

      // Update or create package details
      if (packageData.itinerary || packageData.side_locations || packageData.inclusions) {
        const { error: detailsError } = await supabase
          .from('package_details')
          .upsert({
            package_id: id,
            itinerary: packageData.itinerary || '',
            side_locations: packageData.side_locations || [],
            inclusions: packageData.inclusions || []
          })
        
        if (detailsError) {
          console.error('Package details update error:', detailsError)
        }
      }

      // Delete existing dates and create new ones
      await supabase
        .from('package_dates')
        .delete()
        .eq('package_id', id)

      if (packageData.available_dates && packageData.available_dates.length > 0) {
        const dateInserts = packageData.available_dates.map((date: any) => ({
          package_id: id,
          available_date: date
        }))

        const { error: datesError } = await supabase
          .from('package_dates')
          .insert(dateInserts)
        
        if (datesError) {
          console.error('Package dates update error:', datesError)
        }
      }

      // Fetch the complete updated package
      const { data: completePackage, error: fetchError } = await supabase
        .from('packages')
        .select(`
          *,
          package_dates (
            date_id,
            package_id,
            available_Date
        ),
          package_details (
            detail_id,
            package_id,
            itinerary,
            side_locations,
            inclusions
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Fetch updated package error:', fetchError)
        throw new Error(`Failed to fetch updated package: ${fetchError.message}`)
      }

      return {
        ...completePackage,
        available_dates: completePackage.package_dates || [],
        package_details: completePackage.package_details ? completePackage.package_details[0] : null
      }
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  // Delete a package and related data
  deletePackage: async (id: number): Promise<void> => {
    try {
      // Delete related data first (due to foreign key constraints)
      await supabase.from('package_dates').delete().eq('package_id', id)
      await supabase.from('package_details').delete().eq('package_id', id)
      
      // Then delete the main package
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to delete package: ${error.message}`)
      }
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  // Filter packages with related data
  filterPackages: async (filters: {
    searchTerm?: string
    status?: string
    packageLabel?: string
  }): Promise<ExtendedPackage[]> => {
    try {
      let query = supabase
        .from('packages')
        .select(`
          *,
          package_dates (
            date_id,
            package_id,
            available_Date
          ),
          package_details (
            detail_id,
            package_id,
            itinerary,
            side_locations,
            inclusions
          )
        `)
      
      // Apply filters if they exist
      if (filters.searchTerm && filters.searchTerm.trim()) {
        query = query.ilike('destination', `%${filters.searchTerm.trim()}%`)
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      
      if (filters.packageLabel && filters.packageLabel !== 'all') {
        query = query.eq('tour_type', filters.packageLabel)
      }
      
      
      const { data, error } = await query
      
      if (error) {
        console.error('Supabase filter error:', error)
        throw new Error(`Failed to filter packages: ${error.message}`)
      }
      
      // Transform the data to match the expected format
      const transformedData = (data || []).map(pkg => ({
        ...pkg,
        available_dates: pkg.package_dates || [],
        package_details: pkg.package_details ? pkg.package_details[0] : null
      }))
      
      return transformedData
    } catch (error) {
      console.error('Service filter error:', error)
      throw error
    }
  }
}