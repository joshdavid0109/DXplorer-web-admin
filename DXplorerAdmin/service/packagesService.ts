import { supabase } from '../lib/supabase'
import type { Database } from '../lib/types'

type Package = Database['public']['Tables']['packages']['Row']
type PackageDetail = Database['public']['Tables']['package_details']['Row']

// Extended package type with joined data
export interface ExtendedPackage extends Omit<Package, 'itinerary' | 'side_locations' | 'inclusions' | 'available_dates'> {
  package_id: string
  package_availability: {
    id: string
    package_id: string
    start_date: string
    end_date: string
    remaining_slots: number
  }[]
  package_details: PackageDetail | null
  itinerary: string | null
  side_locations: any[] | null
  inclusions: any[] | null
}

const getCountryCodeFromAPI = async (destination: string): Promise<string> => {
  try {
    let searchTerm = destination.toLowerCase().trim();
    
    // Handle "City, Country" format
    if (searchTerm.includes(',')) {
      const parts = searchTerm.split(',').map(part => part.trim());
      // Use the last part as country (e.g., "Bohol, Philippines" → "Philippines")
      searchTerm = parts[parts.length - 1];
    }
    
    // Try to get country info from REST Countries API
    const response = await fetch(`https://restcountries.com/v3.1/name/${searchTerm}?fields=cca3`);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0]?.cca3) {
        console.log(`Country code for "${destination}" is ${data[0].cca3}`);
        return data[0].cca3; // Returns 3-letter ISO code
      }
    }
  } catch (error) {
    console.log('API lookup failed, using fallback');
  }
  
  // Fallback to first 3 letters if API fails
  return destination.substring(0, 3).toUpperCase();
};


export const packagesService = {
  // Get all packages with related data
  getPackages: async (): Promise<ExtendedPackage[]> => {
    try {
      // Test package_details table first
      const { data: testDetails, error: testError } = await supabase
        .from('package_details')
        .select('*')
        .limit(5)
        
      
      console.log('Test package_details data:', testDetails)
      console.log('Test error:', testError)

      // Test the join to see if it works
      const { data: testJoin, error: joinError } = await supabase
        .from('packages')
        .select('*')
        .limit(3)
      
      console.log('Test join data:', testJoin)
      console.log('Test join error:', joinError)

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
            inclusions,
            image_url
          )
        `)

      console.log('Fetched packages raw data:', JSON.stringify(data, null, 2))
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to fetch packages: ${error.message}`)
      }
      
      // Transform the data to match the expected format
      const transformedData = (data || []).map((pkg, index) => {
        console.log(`\n=== Processing package ${index + 1} ===`)
        console.log('Package ID:', pkg.package_id)
        console.log('Raw package_dates:', pkg.package_dates)
        console.log('Raw package_details:', pkg.package_details)
        console.log('Type of package_details:', typeof pkg.package_details)
        console.log('Is package_details array:', Array.isArray(pkg.package_details))
        console.log('Package_details length:', pkg.package_details?.length)
        
        // Handle package_dates - it's an array from the join
        const availableDates = Array.isArray(pkg.package_dates) ? pkg.package_dates : []
        
        // Handle package_details - it can be either an array or an object depending on the query
        let packageDetails = null
        let itinerary = null
        let side_locations = null
        let inclusions = null
        
        // FIX: Handle both array and object formats
        if (pkg.package_details) {
          if (Array.isArray(pkg.package_details) && pkg.package_details.length > 0) {
            // If it's an array, take the first element
            packageDetails = pkg.package_details[0]
            console.log('Package details found (array format):', packageDetails)
          } else if (typeof pkg.package_details === 'object' && pkg.package_details.detail_id) {
            // If it's an object with detail_id, use it directly
            packageDetails = pkg.package_details
            console.log('Package details found (object format):', packageDetails)
          }
          
          if (packageDetails) {
            itinerary = packageDetails.itinerary
            side_locations = packageDetails.side_locations
            inclusions = packageDetails.inclusions
            
            console.log('Package details extracted:', {
              detail_id: packageDetails.detail_id,
              package_id: packageDetails.package_id,
              itinerary: itinerary,
              side_locations: side_locations,
              inclusions: inclusions
            })
          }
        } 
        
        if (!packageDetails) {
          console.log('No package details found for this package')
          console.log('Debug info:', {
            exists: !!pkg.package_details,
            isArray: Array.isArray(pkg.package_details),
            isObject: typeof pkg.package_details === 'object',
            hasDetailId: pkg.package_details?.detail_id,
            length: pkg.package_details?.length,
            value: pkg.package_details
          })
        }
        
        console.log('Transformed available_dates:', availableDates)
        console.log('Transformed package_details:', packageDetails)
        
        const result = {
          ...pkg,
          available_dates: availableDates,
          package_details: packageDetails,
          itinerary: itinerary,
          side_locations: side_locations,
          inclusions: inclusions
        }
        
        // Remove the original joined arrays to avoid confusion
        delete result.package_dates
        
        console.log('Final result for this package:', {
          package_id: result.package_id,
          destination: result.destination,
          has_package_details: !!result.package_details,
          has_itinerary: !!result.itinerary,
          has_side_locations: !!result.side_locations,
          has_inclusions: !!result.inclusions,
          package_details_content: result.package_details,
          itinerary_content: result.itinerary,
          side_locations_content: result.side_locations,
          inclusions_content: result.inclusions,
          result_keys: Object.keys(result)
        })
        
        return result
      })
      
      console.log('\n=== Final transformed data summary ===')
      transformedData.forEach((pkg, index) => {
        console.log(`Package ${index + 1}:`, {
          package_id: pkg.package_id,
          destination: pkg.destination,
          has_details: !!pkg.package_details,
          details_content: pkg.package_details ? {
            itinerary: pkg.package_details.itinerary,
            side_locations: pkg.package_details.side_locations,
            inclusions: pkg.package_details.inclusions
          } : null
        })
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
          package_details: relatedDetails.length > 0 ? relatedDetails[0] : null,
          itinerary: relatedDetails.length > 0 ? relatedDetails[0].itinerary : null,
          side_locations: relatedDetails.length > 0 ? relatedDetails[0].side_locations : null,
          inclusions: relatedDetails.length > 0 ? relatedDetails[0].inclusions : null
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
      const countryCode = await getCountryCodeFromAPI(packageData.destination);

      const generatedPackageId =
        packageData.destination.substring(0, 3).toUpperCase() +
        countryCode +
        packageData.duration +
        packageData.nights;

      // First create the main package
      const { data: packageResult, error: packageError } = await supabase
        .from('packages')
        .insert([{
          package_id: generatedPackageId, // Assuming you have a function to generate unique IDs
          main_location: packageData.destination, // Updated column name
          duration: packageData.duration,
          nights: packageData.nights,
          price: packageData.price,
          total_slots: packageData.total_slots,
          status: packageData.status,
          tour_type: packageData.tour_type
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
            package_id: packageResult.package_id,
            itinerary: packageData.itinerary || '',
            side_locations: packageData.side_locations || [],
            inclusions: packageData.inclusions || [],
            image_url: packageData.image_url || null // Move image_url to package_details
          }])
        
        if (detailsError) {
          console.error('Package details creation error:', detailsError)
          // Don't throw here, just log the error
        }
      }

      // Create package dates if provided
      if (packageData.available_dates && packageData.available_dates.length > 0) {
        const dateInserts = packageData.available_dates.map((date: any) => ({
          package_id: packageResult.package_id,
          available_Date: Array.isArray(date) ? date : [date] // Store the entire date object as JSONB
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
        .eq('package_id', packageResult.package_id)
        .single()

      console.log('Fetched complete package:', completePackage)

      if (fetchError) {
        console.error('Fetch complete package error:', fetchError)
        throw new Error(`Failed to fetch created package: ${fetchError.message}`)
      }

      // Transform the joined data properly - handle both array and object formats
      let packageDetails = null
      if (completePackage.package_details) {
        if (Array.isArray(completePackage.package_details) && completePackage.package_details.length > 0) {
          packageDetails = completePackage.package_details[0]
        } else if (typeof completePackage.package_details === 'object' && completePackage.package_details.detail_id) {
          packageDetails = completePackage.package_details
        }
      }

      return {
        ...completePackage,
        available_dates: Array.isArray(completePackage.package_dates) ? completePackage.package_dates : [],
        package_details: packageDetails,
        itinerary: packageDetails?.itinerary || null,
        side_locations: packageDetails?.side_locations || null,
        inclusions: packageDetails?.inclusions || null
      }
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

updatePackage: async (packageId: string, packageData: any) => {
  try {
    /* ===============================
       1. UPDATE packages (NO image_url)
    ================================ */
    const { error: pkgError } = await supabase
      .from("packages")
      .update({
        main_location: packageData.destination,
        price: packageData.price,
        duration: packageData.duration,
        nights: packageData.nights,
        status: packageData.status,
        tour_type: packageData.tour_type,
      })
      .eq("package_id", packageId);

    if (pkgError) throw pkgError;

    /* ===============================
       2. UPSERT package_details (IMAGE GOES HERE)
    ================================ */
    const { error: detailsError } = await supabase
      .from("package_details")
      .upsert(
        {
          package_id: packageId,
          itinerary: packageData.itinerary || "",
          side_locations: packageData.side_locations || [],
          inclusions: packageData.inclusions || [],
          image_url: packageData.image_url
            ? Array.isArray(packageData.image_url)
              ? packageData.image_url
              : [packageData.image_url]
            : [],
        },
        { onConflict: "package_id" }
      );

    if (detailsError) throw detailsError;

    /* ===============================
       3. REPLACE package_dates
    ================================ */
    await supabase
      .from("package_dates")
      .delete()
      .eq("package_id", packageId);

    if (Array.isArray(packageData.available_dates)) {
      const rows = packageData.available_dates.map((d: any) => ({
        package_id: packageId,
        available_Date: [
          {
            start: d.start,
            end: d.end,
            remaining_slots: d.remaining_slots,
          },
        ],
      }));

      if (rows.length) {
        const { error } = await supabase
          .from("package_dates")
          .insert(rows);
        if (error) throw error;
      }
    }

    return true;
  } catch (err) {
    console.error("❌ updatePackage failed:", err);
    throw err;
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
        .eq('package_id', id)
      
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
        query = query.ilike('main_location', `%${filters.searchTerm.trim()}%`)
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
      const transformedData = (data || []).map(pkg => {
        let packageDetails = null
        if (pkg.package_details) {
          if (Array.isArray(pkg.package_details) && pkg.package_details.length > 0) {
            packageDetails = pkg.package_details[0]
          } else if (typeof pkg.package_details === 'object' && pkg.package_details.detail_id) {
            packageDetails = pkg.package_details
          }
        }

        return {
          ...pkg,
          available_dates: Array.isArray(pkg.package_dates) ? pkg.package_dates : [],
          package_details: packageDetails,
          itinerary: packageDetails?.itinerary || null,
          side_locations: packageDetails?.side_locations || null,
          inclusions: packageDetails?.inclusions || null
        }
      })
      
      return transformedData
    } catch (error) {
      console.error('Service filter error:', error)
      throw error
    }
  }
}