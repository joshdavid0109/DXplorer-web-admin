import { useState, useEffect } from 'react'
import { packagesService, type ExtendedPackage } from './packagesService'
import type { Database } from '../lib/types'

type PackageInsert = Database['public']['Tables']['packages']['Insert']
type PackageUpdate = Database['public']['Tables']['packages']['Update']

export const usePackages = () => {
  const [packages, setPackages] = useState<ExtendedPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPackages = async () => {
  try {
    setLoading(true)
    setError(null)
    
    console.log('=== usePackages: Starting fetch ===')
    const data = await packagesService.getPackages()
    
    console.log('=== usePackages: Received data ===')
    console.log('Data length:', data.length)
    console.log('Raw data from service:', JSON.stringify(data, null, 2))
    
    // Transform the data to ensure proper structure
    const transformedData = data.map(pkg => {
      console.log(`\n--- Processing package ${pkg.package_id} ---`)
      
      let packageDetails = pkg.package_details;
      if (Array.isArray(packageDetails) && packageDetails.length > 0) {
        packageDetails = packageDetails[0];
      }
      
      const transformed = {
        ...pkg,
        id: pkg.package_id, // ADD THIS LINE - map package_id to id
        destination: pkg.destination || pkg.main_location || 'Unknown Location', // ADD THIS LINE
        image_url: pkg.image_uri || pkg.image || '', // ADD THIS LINE
        package_details: packageDetails,
        side_locations: pkg.side_locations || packageDetails?.side_locations || [],
        inclusions: pkg.inclusions || packageDetails?.inclusions || [],
        itinerary: pkg.itinerary || packageDetails?.itinerary || ''
      };
      
      return transformed;
    });

    
    setPackages(transformedData)
    console.log('=== usePackages: State updated with transformed data ===')
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch packages'
    setError(errorMessage)
    console.error('Fetch packages error:', err)
  } finally {
    setLoading(false)
  }
}

  const createPackage = async (packageData: any) => {
    try {
      setError(null)
      const newPackage = await packagesService.createPackage(packageData)
      setPackages(prev => [newPackage, ...prev])
      return newPackage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create package'
      setError(errorMessage)
      console.error('Create package error:', err)
      throw err
    }
  }

  const updatePackage = async (id: number, packageData: any) => {
    try {
      setError(null)
      const updatedPackage = await packagesService.updatePackage(id, packageData)
      setPackages(prev => prev.map(pkg =>
        pkg.package_id === id ? { ...updatedPackage, id: updatedPackage.package_id } : pkg
      ))
      return updatedPackage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update package'
      setError(errorMessage)
      console.error('Update package error:', err)
      throw err
    }
  }

  const deletePackage = async (id: number) => {
    try {
      setError(null)
      await packagesService.deletePackage(id)
      setPackages(prev => prev.filter(pkg => pkg.package_id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete package'
      setError(errorMessage)
      console.error('Delete package error:', err)
      throw err
    }
  }

  const filterPackages = async (filters: {
    searchTerm?: string
    status?: string
    packageLabel?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const data = await packagesService.filterPackages(filters)
      setPackages(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter packages'
      setError(errorMessage)
      console.error('Filter packages error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  return {
    packages,
    loading,
    error,
    createPackage,
    updatePackage,
    deletePackage,
    filterPackages,
    refetch: fetchPackages
  }
}