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
      const data = await packagesService.getPackages()
      setPackages(data)
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
        pkg.id === id ? updatedPackage : pkg
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
      setPackages(prev => prev.filter(pkg => pkg.id !== id))
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