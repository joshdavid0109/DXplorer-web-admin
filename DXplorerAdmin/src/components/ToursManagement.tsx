import React, { useState, useEffect } from 'react';
import { MapPin, Edit3, Eye, Plus, Search, Filter, Star, Calendar, DollarSign, Users, Trash2, Image, X, Clock, Moon } from 'lucide-react';
import { usePackages } from '../../service/usePackages'; // Import your custom hook
import type { ExtendedPackage } from '../../service/packagesService'; // Import the ExtendedPackage type
import type { Database } from '../../lib/types'; // Import the Database type

type Tour = ExtendedPackage; // Use the ExtendedPackage type for Tour

// Update your interface to match the database structure
interface DateRange {
  start: string;
  end: string;
  remaining_slots: number;
}

// Use the database type
type TourInsert = Database['public']['Tables']['packages']['Insert'];

// Update the form data interface to match database fields
interface TourFormData {
  destination: string;
  price: number;
  image_url: string;
  itinerary: string;
  side_locations: string[];
  inclusions: string[];
  available_dates: DateRange[];
  duration: number;
  nights: number;
  status: 'Active' | 'Inactive' | 'Draft';
  tour_type: 'Domestic' | 'International';
}

const ToursManagement: React.FC = () => {
  // Replace useState with the custom hook
  const { packages, loading, error, createPackage, updatePackage, deletePackage, filterPackages } = usePackages();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive' | 'Draft'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Domestic' | 'International'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [viewingTour, setViewingTour] = useState<Tour | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [dateRangeInput, setDateRangeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<TourFormData>({
    destination: '',
    price: 0,
    image_url: '',
    itinerary: '',
    side_locations: [],
    inclusions: [],
    available_dates: [],
    duration: 1,
    nights: 1,
    status: 'Draft',
    tour_type: 'Domestic'
  });

  // Filter tours whenever filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      filterPackages({
        searchTerm: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        packageLabel: typeFilter !== 'all' ? typeFilter : undefined
      });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter, typeFilter]);

  const handleAddTour = () => {
    setEditingTour(null);
    setFormData({
      destination: '',
      price: 0,
      image_url: '',
      itinerary: '',
      side_locations: [],
      inclusions: [],
      available_dates: [],
      duration: 1,
      nights: 1,
      status: 'Draft',
      tour_type: 'Domestic'
    });
    setDateRangeInput('');
    setShowModal(true);
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    const availableDates = getAvailableDates(tour); // Use helper function
    
    setFormData({
      destination: getDestination(tour), // Use helper function
      price: tour.price,
      image_url: getImageUrl(tour), // Use helper function
      itinerary: getItinerary(tour), // Use helper function
      side_locations: getSideLocations(tour), // Use helper function
      inclusions: getInclusions(tour), // Use helper function
      available_dates: availableDates, // Use helper function
      duration: tour.duration,
      nights: tour.nights,
      status: tour.status,
      tour_type: tour.tour_type
    });
    
    // Format date ranges for editing
    const formattedDates = availableDates.map(date => 
      `${date.start} to ${date.end} (${date.remaining_slots} slots)`
    ).join(', ');
    setDateRangeInput(formattedDates);
    setShowModal(true);
  };

  const handleViewTour = (tour: Tour) => {
    console.log('Setting viewingTour:', tour); // Debug line
    setViewingTour(tour);
    setShowViewModal(true);
  };

  const handleDeleteTour = async (tourId: number) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        await deletePackage(tourId);
      } catch (error) {
        console.error('Failed to delete tour:', error);
        alert('Failed to delete tour. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (editingTour) {
        // Update existing tour
        await updatePackage(editingTour.id, formData);
      } else {
        // Create new tour
        await createPackage(formData);
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save tour:', error);
      alert('Failed to save tour. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrayInput = (value: string, field: 'side_locations' | 'inclusions') => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({ ...formData, [field]: items });
  };

  const handleDateRangeInput = (value: string) => {
    setDateRangeInput(value);
    // Parse date ranges: "2024-08-15 to 2024-08-20 (10 slots), 2024-08-22 to 2024-08-27 (15 slots)"
    const ranges = value.split(',').map(range => {
      const match = range.trim().match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\s+\((\d+)\s+slots\)/);
      if (match) {
        return {
          start: match[1],
          end: match[2],
          remaining_slots: parseInt(match[3])
        };
      }
      return null;
    }).filter(range => range !== null) as DateRange[];
    
    setFormData({ ...formData, available_dates: ranges });
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase(); // Add this line
    switch (normalizedStatus) { // Change this line
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTourTypeColor = (type: string) => {
    return type === 'International' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  const formatDateRange = (dateRange: DateRange) => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  };

  const getNextAvailableDate = (tour: Tour) => {
    const now = new Date();
    const availableDates = getAvailableDates(tour); // Use helper function
    
    if (availableDates.length === 0) {
      return 'No upcoming dates';
    }
    
    const upcoming = availableDates.find(date => new Date(date.start) > now);
    return upcoming ? formatDateRange(upcoming) : 'No upcoming dates';
  };

  // Show loading state
  if (loading && packages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tours...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get the destination from tour object
const getDestination = (tour: Tour) => {
  return tour.destination || tour.main_location || 'Unknown Location';
};

// Helper function to get available dates from tour object
const getAvailableDates = (tour: Tour) => {
  if (tour.available_dates) {
    // Handle new structure with available_Date array
    if (Array.isArray(tour.available_dates) && tour.available_dates.length > 0) {
      const firstDateSet = tour.available_dates[0];
      if (firstDateSet.available_Date) {
        return firstDateSet.available_Date.map(date => ({
          start: date.start,
          end: date.end,
          remaining_slots: parseInt(date.remaining_slots.toString())
        }));
      }
    }
    // Handle direct array format (fallback)
    if (Array.isArray(tour.available_dates) && tour.available_dates.length > 0 && tour.available_dates[0].start) {
      return tour.available_dates;
    }
  }
  return [];
};

  // Helper function to get side locations
  const getSideLocations = (tour: Tour) => {
    // Handle array format
    if (Array.isArray(tour.package_details) && tour.package_details.length > 0) {
      return tour.package_details[0].side_locations || [];
    }
    // Handle object format (fallback)
    return tour.package_details?.side_locations || tour.side_locations || [];
  };

  // Helper function to get inclusions
  const getInclusions = (tour: Tour) => {
    // Handle array format
    if (Array.isArray(tour.package_details) && tour.package_details.length > 0) {
      return tour.package_details[0].inclusions || [];
    }
    // Handle object format (fallback)
    return tour.package_details?.inclusions || tour.inclusions || [];
  };

  // Helper function to get itinerary
  const getItinerary = (tour: Tour) => {
    // Handle array format
    if (Array.isArray(tour.package_details) && tour.package_details.length > 0) {
      return tour.package_details[0].itinerary || '';
    }
    // Handle object format (fallback)
    return tour.package_details?.itinerary || tour.itinerary || '';
  };

  // Helper function to get image URL
  const getImageUrl = (tour: Tour) => {
    return tour.image_url || tour.image || 'https://via.placeholder.com/400x300?text=No+Image';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tours Management</h2>
          <p className="text-gray-600">Create, edit, and manage your tour packages</p>
        </div>
        <button
          onClick={handleAddTour}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-[#154689] text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Tour</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Draft">Draft</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Domestic">Domestic</option>
            <option value="International">International</option>
          </select>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((tour) => (
          <div key={tour.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <img
                src={getImageUrl(tour)} // Use helper function
                alt={getDestination(tour)} // Use helper function
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex flex-col gap-1 text-center">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tour.status)}`}>
                  {tour.status}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTourTypeColor(tour.tour_type)}`}>
                  {tour.tour_type}
                </span>
              </div>
              {(tour.rating || 0) > 0 && (
                <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  <Star className="h-3 w-3 fill-current text-yellow-400" />
                  <span className="text-sm">{tour.rating || 0}</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{getDestination(tour)}</h3>
              
              {/* Duration and Nights */}
              <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{tour.duration} days</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Moon className="h-4 w-4" />
                  <span>{tour.nights} nights</span>
                </div>
              </div>

              {/* Next Available Date */}
              <div className="flex items-center space-x-1 mb-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{getNextAvailableDate(tour)}</span>
              </div>

              {/* Side Locations Preview */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {(getSideLocations(tour) || []).slice(0, 2).map((location, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {location}
                    </span>
                  ))}
                  {(tour.package_details?.side_locations || []).length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      +{getSideLocations(tour).length - 2} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-gray-900">₱{tour.price.toLocaleString()}</span>
                <span className="text-sm text-gray-500">per pax</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{tour.bookings || 0} bookings</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>₱{(tour.revenue || 0).toLocaleString()}</span>
                </div>
              </div>
                            
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewTour(tour)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleEditTour(tour)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteTour(tour.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingTour ? 'Edit Tour' : 'Add New Tour'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (PHP)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nights
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.nights}
                      onChange={(e) => setFormData({ ...formData, nights: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tour Type
                    </label>
                    <select
                      value={formData.tour_type}
                      onChange={(e) => setFormData({ ...formData, tour_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Domestic">Domestic</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Side Locations (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.side_locations.join(', ')}
                    onChange={(e) => handleArrayInput(e.target.value, 'side_locations')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Boracay, Palawan, Bohol"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inclusions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.inclusions.join(', ')}
                    onChange={(e) => handleArrayInput(e.target.value, 'inclusions')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Accommodation, Meals, Transportation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Dates
                  </label>
                  <input
                    type="text"
                    value={dateRangeInput}
                    onChange={(e) => handleDateRangeInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2024-08-15 to 2024-08-20 (10 slots), 2024-08-22 to 2024-08-27 (15 slots)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: YYYY-MM-DD to YYYY-MM-DD (slots available), separate multiple ranges with commas
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Itinerary
                  </label>
                  <textarea
                    value={formData.itinerary}
                    onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Describe the tour itinerary..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#154689] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{editingTour ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{editingTour ? 'Update Tour' : 'Create Tour'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tour Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Tour Image */}
                <div className="relative">
                  <img
                    src={getImageUrl(viewingTour)}
                    alt={getDestination(viewingTour)}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(viewingTour.status)}`}>
                      {viewingTour.status}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTourTypeColor(viewingTour.tour_type)}`}>
                      {viewingTour.tour_type}
                    </span>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xl font-semibold mb-2">{getDestination(viewingTour)}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">₱{(viewingTour.price || 0).toLocaleString()}</span>
                        <span className="text-gray-500">per pax</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{viewingTour.duration} days, {viewingTour.nights} nights</span>
                      </div>
                      {(viewingTour.rating || 0) > 0 && (
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{viewingTour.rating || 0}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-2">Statistics</h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{viewingTour.bookings || 0} bookings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>₱{(viewingTour.revenue || 0).toLocaleString()} revenue</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side Locations */}
                <div>
                  <h5 className="font-semibold mb-2">Side Locations</h5>
                  <div className="flex flex-wrap gap-2">
                    {(getSideLocations(viewingTour) || []).map((location, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {location}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Inclusions */}
                <div>
                  <h5 className="font-semibold mb-2">Inclusions</h5>
                  <div className="flex flex-wrap gap-2">
                    {(getInclusions(viewingTour) || []).map((inclusion, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {inclusion}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Available Dates */}
                <div>
                  <h5 className="font-semibold mb-2">Available Dates</h5>
                  {getAvailableDates(viewingTour).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getAvailableDates(viewingTour).map((dateRange, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{formatDateRange(dateRange)}</span>
                          <span className="text-sm text-gray-500">{dateRange.remaining_slots} slots</span>
                        </div>
                      </div>
                    ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No available dates</p>
                  )}
                </div>

                {/* Itinerary */}
                <div>
                  <h5 className="font-semibold mb-2">Itinerary</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{getItinerary(viewingTour)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {packages.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tours found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first tour package.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
            <button
              onClick={handleAddTour}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#154689] text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Tour</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ToursManagement;