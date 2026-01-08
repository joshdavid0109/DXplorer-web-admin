import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, MapPin, Edit3, Eye, Plus, Search, Filter, Star, Calendar, DollarSign, Users, Upload, Trash2, Image, X, Clock, Moon } from 'lucide-react';
import { usePackages } from '../../service/usePackages'; // Import your custom hook
import type { ExtendedPackage } from '../../service/packagesService'; // Import the ExtendedPackage type
import { supabase } from '../../lib/supabase';

type Tour = ExtendedPackage; // Use the ExtendedPackage type for Tour

// Update your interface to match the database structure
interface DateRange {
  start: string;
  end: string;
  remaining_slots: number;
}


// Update the form data interface to match database fields
interface TourFormData {
  destination: string;
  price: number;
  image_url: string [];
  itinerary: string;
  side_locations: string[];
  inclusions: string[];
  available_dates: DateRange[];
  duration: number;
  nights: number;
  status: 'active' | 'inactive' | 'archived';
  tour_type: 'Domestic' | 'International';
}

const ToursManagement: React.FC = () => {
  // Replace useState with the custom hook
  const { packages, loading, error, createPackage, updatePackage, deletePackage, filterPackages, refresh} = usePackages();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Domestic' | 'International'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [viewingTour, setViewingTour] = useState<Tour | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sideLocationInputs, setSideLocationInputs] = useState(['']);
  const [inclusionInputs, setInclusionInputs] = useState([{item: '', note: ''}]);
  const [dateRangeInputs, setDateRangeInputs] = useState([{ start: '', end: '', slots: 1 }]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

const getDestination = (tour: Tour) => {
  if (!tour) return 'Unknown Location';
  try {
    return tour.main_location || 'Unknown Location';
  } catch (error) {
    console.error('Error getting destination:', error);
    return 'Unknown Location';
  }
};

const getAvailableDates = (tour: Tour): DateRange[] => {
  if (!Array.isArray(tour.package_availability)) return [];

  return tour.package_availability
    .map(d => ({
      start: d.start_date,
      end: d.end_date,
      remaining_slots: Number(d.remaining_slots) || 0,
    }))
    .sort(
      (a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
    );
};




const getSideLocations = (tour: Tour) => {
  if (!tour) return [];
  
  try {
    let sideLocations = [];
    
    // Check if side_locations is directly on the tour object
    if (tour.side_locations && Array.isArray(tour.side_locations)) {
      sideLocations = tour.side_locations;
    }
    // Check package_details structure
    else if (tour.package_details) {
      if (!Array.isArray(tour.package_details)) {
        // Single package_details object
        sideLocations = tour.package_details.side_locations || [];
      } else if (tour.package_details.length > 0) {
        // Array of package_details
        sideLocations = tour.package_details[0].side_locations || [];
      }
    }
    
    // Flatten and clean the side_locations array
    const flattenedLocations: string[] = [];
    
    const processItem = (item: any) => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item !== null) {
        // Handle object values - extract string values
        const values = Object.values(item);
        return values.filter(val => typeof val === 'string').join(', ');
      }
      return null;
    };
    
    const flattenArray = (arr: any[]) => {
      for (const item of arr) {
        if (Array.isArray(item)) {
          flattenArray(item);
        } else {
          const processed = processItem(item);
          if (processed && processed.trim()) {
            flattenedLocations.push(processed.trim());
          }
        }
      }
    };
    
    if (Array.isArray(sideLocations)) {
      flattenArray(sideLocations);
    }
    
    // Remove duplicates and empty strings
    return [...new Set(flattenedLocations)].filter(item => item && item.length > 0);
    
  } catch (error) {
    console.error('Error getting side locations:', error);
    return [];
  }
};

const getInclusions = (tour: Tour) => {
  if (!tour) return [];
  
  try {
    let inclusions = [];
    
    // Check if inclusions is directly on the tour object
    if (tour.inclusions && Array.isArray(tour.inclusions)) {
      inclusions = tour.inclusions;
    }
    // Check package_details structure
    else if (tour.package_details) {
      if (!Array.isArray(tour.package_details)) {
        inclusions = tour.package_details.inclusions || [];
      } else if (tour.package_details.length > 0) {
        inclusions = tour.package_details[0].inclusions || [];
      }
    }
    
    const processedInclusions: string[] = [];
    
    const processItem = (item: any) => {
      if (typeof item === 'string') {
        return [item];
      } else if (typeof item === 'object' && item !== null) {
        const results = [];
        
        // Handle object with key-value pairs (like "HOTEL + DAILY TOUR": "TOURS ONLY NO TRANSFER")
        for (const [key, value] of Object.entries(item)) {
          if (typeof key === 'string' && key.trim()) {
            if (typeof value === 'string' && value.trim()) {
              // Combine key and value into a single inclusion with note in parentheses
              results.push(`${key.trim()} (${value.trim()})`);
            } else {
              // Just the key if no meaningful value
              results.push(key.trim());
            }
          }
        }
        
        return results;
      }
      return [];
    };
    
    const flattenArray = (arr: any[]) => {
      for (const item of arr) {
        if (Array.isArray(item)) {
          flattenArray(item);
        } else {
          const processed = processItem(item);
          processed.forEach(processedItem => {
            if (processedItem && processedItem.trim()) {
              processedInclusions.push(processedItem.trim());
            }
          });
        }
      }
    };
    
    if (Array.isArray(inclusions)) {
      flattenArray(inclusions);
    }
    
    // Remove duplicates and empty strings
    return [...new Set(processedInclusions)].filter(item => item && item.length > 0);
    
  } catch (error) {
    console.error('Error getting inclusions:', error);
    return [];
  }
};

const getItinerary = (tour: Tour) => {
  if (!tour) return '';
  
  try {
    if (tour.package_details && !Array.isArray(tour.package_details)) {
      return tour.package_details.itinerary || '';
    }
    if (Array.isArray(tour.package_details) && tour.package_details.length > 0) {
      return tour.package_details[0].itinerary || '';
    }
    return tour.itinerary || '';
  } catch (error) {
    console.error('Error getting itinerary:', error);
    return '';
  }
};

const validateFile = (file: any) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    return 'Please select a valid image file (JPG, PNG, GIF, or WebP)';
  }
  
  if (file.size > maxSize) {
    return 'File size must be less than 5MB';
  }
  
  return null;
};


const uploadImageToSupabase = async (file: File) => {
  const error = validateFile(file);
  if (error) {
    setImageError(error);
    return null;
  }

  const filePath = `packages/japan/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error(uploadError);
    setImageError(uploadError.message);
    return null;
  }

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Drag and drop handlers
const handleDragOver = (e: any) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(true);
};

const handleDragLeave = (e: any) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Only set isDragging to false if we're leaving the drop zone entirely
  if (!e.currentTarget.contains(e.relatedTarget)) {
    setIsDragging(false);
  }
};

const handleDrop = async (e: any) => {
  e.preventDefault();
  setIsDragging(false);

  const files = Array.from(e.dataTransfer.files);
  for (const file of files) {
    await handleFileUpload(file);
  }
};


const handleFileSelect = async (e: any) => {
  const files = Array.from(e.target.files || []);
  for (const file of files) {
    await handleFileUpload(file);
  }
};


const handleFileUpload = async (file: any) => {
  setUploadProgress(10);
  setImageError('');

  const progressInterval = setInterval(() => {
    setUploadProgress(prev => {
      if (prev >= 90) {
        clearInterval(progressInterval);
        return prev;
      }
      return prev + 10;
    });
  }, 100);

  try {
    const imageUrl = await uploadImageToSupabase(file);
    console.log('Returned imageUrl:', imageUrl);

    if (imageUrl) {
  setFormData(prev => ({
    ...prev,
    image_url: [...prev.image_url, imageUrl] // ✅ append
  }));


      setUploadProgress(100);
      console.log('Image uploaded successfully:', imageUrl);

      setTimeout(() => setUploadProgress(0), 1000);
    } else {
      console.warn('Image URL not returned');
      setImageError('Failed to get image URL after upload');
      setUploadProgress(0);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    setImageError('Failed to upload image. Please try again.');
    setUploadProgress(0);
  }

  clearInterval(progressInterval);
};


const getImageUrl = (tour: Tour): string => {
  const images = tour.package_details?.image_url;
  return Array.isArray(images) && images.length
    ? images[0]
    : 'https://via.placeholder.com/400x300?text=No+Image';
};



const addSideLocationInput = () => {
  setSideLocationInputs([...sideLocationInputs, '']);
};

const removeSideLocationInput = (index: any) => {
  if (sideLocationInputs.length > 1) {
    const newInputs = sideLocationInputs.filter((_, i) => i !== index);
    setSideLocationInputs(newInputs);
    const newLocations = newInputs.filter(input => input.trim());
    setFormData({ ...formData, side_locations: newLocations });
  }
};

const updateSideLocationInput = (index: number, value: string) => {
  const newInputs = [...sideLocationInputs];
  newInputs[index] = value;
  setSideLocationInputs(newInputs);
  const newLocations = newInputs.filter(input => input.trim());
  setFormData({ ...formData, side_locations: newLocations });
};

const addInclusionInput = () => {
  setInclusionInputs([...inclusionInputs, { item: '', note: '' }]);
};

const removeInclusionInput = (index: number) => {
  setInclusionInputs(inclusionInputs.filter((_, i) => i !== index));
};

const updateInclusionInput = (index: number, field: keyof { item: string; note: string }, value: string) => {
  const updated = [...inclusionInputs];
  updated[index][field] = value;
  setInclusionInputs(updated);
  
  // Update form data to reflect current inclusions
  const newInclusions = updated
    .filter(inc => inc.item && inc.item.trim())
    .map(inc => {
      // If both item and note exist, combine them as "item: note"
      if (inc.note && inc.note.trim()) {
        return `${inc.item}: ${inc.note}`;
      }
      return inc.item;
    });
  setFormData({ ...formData, inclusions: newInclusions });
};

const addDateRangeInput = () => {
  setDateRangeInputs([...dateRangeInputs, { start: '', end: '', slots: 1 }]);
};

const removeDateRangeInput = (index: number) => {
  if (dateRangeInputs.length > 1) {
    const newInputs = dateRangeInputs.filter((_, i) => i !== index);
    setDateRangeInputs(newInputs);
    const newDates = newInputs.filter(input => input.start && input.end).map(input => ({
      start: input.start,
      end: input.end,
      remaining_slots: input.slots
    }));
    setFormData({ ...formData, available_dates: newDates });
  }
};

const updateDateRangeInput = (index: number, field: keyof { start: string; end: string; slots: number }, value: string) => {
  const newInputs = [...dateRangeInputs];
  (newInputs[index] as any)[field] = field === 'slots' ? parseInt(value) || 1 : value;
  setDateRangeInputs(newInputs);
  const newDates = newInputs.filter(input => input.start && input.end).map(input => ({
    start: input.start,
    end: input.end,
    remaining_slots: input.slots
  }));
  setFormData({ ...formData, available_dates: newDates });
};

  const [formData, setFormData] = useState<TourFormData>({
    destination: '',
    price: 0,
    image_url: [],
    itinerary: '',
    side_locations: [],
    inclusions: [],
    available_dates: [],
    duration: 1,
    nights: 1,
    status: 'archived',
    tour_type: 'Domestic'
  });

useEffect(() => {
  console.log('FormData updated:', formData);
  console.log('Image URL in formData:', formData.image_url);
}, [formData]);

  useEffect(() => {
    // Don’t filter until data is loaded
    if (refresh.length === 0) return;

    const debounce = setTimeout(() => {
      filterPackages({
        searchTerm,
        status: statusFilter,
        packageLabel: typeFilter
      });
    }, 200);

    return () => clearTimeout(debounce);
  }, [searchTerm, statusFilter, typeFilter, refresh]);




  const handleAddTour = () => {
  setEditingTour(null);
  setFormData({
    destination: '',
    price: 0,
    image_url: [],
    itinerary: '',
    side_locations: [],
    inclusions: [],
    available_dates: [],
    duration: 1,
    nights: 1,
    status: 'archived',
    tour_type: 'Domestic'
  });
  setSideLocationInputs(['']);
  setInclusionInputs([{ item: '', note: '' }]);
  setDateRangeInputs([{ start: '', end: '', slots: 1 }]);
  setShowModal(true);
};

const handleEditTour = (tour: Tour) => {
  setEditingTour(tour);
  const availableDates = getAvailableDates(tour);
  const sideLocations = getSideLocations(tour);
  const inclusions = getInclusions(tour);
  const images =
    tour.package_details?.image_url && Array.isArray(tour.package_details.image_url)
      ? tour.package_details.image_url
      : [];
    
  setFormData({
    destination: getDestination(tour),
    price: tour.price,
    image_url: images,
    itinerary: getItinerary(tour),
    side_locations: sideLocations,
    inclusions: inclusions,
    available_dates: availableDates,
    duration: tour.duration,
    nights: tour.nights,
    status: tour.status?.toLowerCase() as 'active' | 'inactive' | 'archived',
    tour_type: tour.tour_type
  });

  // Set the uploaded image URL for preview

  // ... rest of the function remains the same
  const inclusionObjects = inclusions.map(inclusion => {
    const colonIndex = inclusion.indexOf(':');
    if (colonIndex > 0) {
      return { 
        item: inclusion.substring(0, colonIndex).trim(), 
        note: inclusion.substring(colonIndex + 1).trim() 
      };
    }
    const noteMatch = inclusion.match(/^(.+)\s+\((.+)\)$/);
    if (noteMatch) {
      return { item: noteMatch[1].trim(), note: noteMatch[2].trim() };
    }
    return { item: inclusion, note: '' };
  });
  
  setSideLocationInputs(sideLocations.length > 0 ? sideLocations : ['']);
  setInclusionInputs(inclusionObjects.length > 0 ? inclusionObjects : [{ item: '', note: '' }]);
  setDateRangeInputs(availableDates.length > 0 ? availableDates.map((date: any) => ({
    start: date.start,
    end: date.end,
    slots: date.remaining_slots
  })) : [{ start: '', end: '', slots: 1 }]);
  
  setShowModal(true);
};


  const handleViewTour = (tour: Tour) => {
    console.log('Setting viewingTour:', tour);
    
    // Add null check and defensive programming
    if (!tour || !tour.package_id) {
      console.error('Invalid tour object:', tour);
      alert('Error: Invalid tour data');
      return;
    }
    
    try {
      setViewingTour(tour);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error setting viewing tour:', error);
      alert('Error opening tour details');
    }
  };

  const handleDeleteTour = async (tour: Tour) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        await deletePackage(tour.package_id);
      } catch (error) {
        console.error('Failed to delete tour:', error);
        alert('Failed to delete tour. Please try again.');
      }
    }
  };

  // 1️⃣ Open confirmation modal only
const handleSubmit = () => {
  setShowConfirmModal(true);
};

// 2️⃣ ACTUAL save happens here
const handleConfirmedSave = async () => {
  setIsSubmitting(true);

  try {
    if (editingTour) {
      await updatePackage(editingTour.package_id, formData);
    } else {
      await createPackage(formData);
    }

    await refresh(); // ✅ correct

    setShowModal(false);
    setShowSuccessModal(true);
  } catch (error) {
    console.error('Failed to save tour:', error);
    alert('Failed to save tour. Please try again.');
  } finally {
    setIsSubmitting(false);
    setShowConfirmModal(false);
  }
};



  // const handleArrayInput = (value: string, field: 'side_locations' | 'inclusions') => {
  //   const items = value.split(',').map(item => item.trim()).filter(item => item);
  //   setFormData({ ...formData, [field]: items });
  // };

  // const handleDateRangeInput = (value: string) => {
  //   setDateRangeInput(value);
  //   // Parse date ranges: "2024-08-15 to 2024-08-20 (10 slots), 2024-08-22 to 2024-08-27 (15 slots)"
  //   const ranges = value.split(',').map(range => {
  //     const match = range.trim().match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\s+\((\d+)\s+slots\)/);
  //     if (match) {
  //       return {
  //         start: match[1],
  //         end: match[2],
  //         remaining_slots: parseInt(match[3])
  //       };
  //     }
  //     return null;
  //   }).filter(range => range !== null) as DateRange[];
  //   
  //   setFormData({ ...formData, available_dates: ranges });
  // };

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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 🔥 normalize to start of day

    const availableDates = getAvailableDates(tour);

    if (!availableDates.length) {
      return 'No upcoming dates';
    }

    const upcoming = availableDates.find(date => {
      const start = new Date(date.start);
      start.setHours(0, 0, 0, 0); // 🔥 normalize
      return start >= today;
    });

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
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tours Management</h1>
        <p className="text-gray-600">Create, edit, and manage your tour packages</p>
      </div>
        
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
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="archived">archived</option>
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
          <div key={tour.package_id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1">
            <div className="relative overflow-hidden">
              <img
                src={getImageUrl(tour)} // Use helper function
                alt={getDestination(tour)} // Use helper function
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${getStatusColor(tour.status)}`}>
                  {tour.status}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${getTourTypeColor(tour.tour_type)}`}>
                  {tour.tour_type}
                </span>
              </div>
              
              {(tour.rating || 0) > 0 && (
                <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-sm font-medium">{tour.rating || 0}</span>
                </div>
              )}
            </div>
            
            <div className="p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-lg leading-tight">{getDestination(tour)}</h3>
              
              {/* Duration and Nights */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center space-x-1.5 text-gray-600">
                  <div className="p-1 bg-blue-50 rounded-lg">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">{tour.duration} days</span>
                </div>
                <div className="flex items-center space-x-1.5 text-gray-600">
                  <div className="p-1 bg-purple-50 rounded-lg">
                    <Moon className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">{tour.nights} nights</span>
                </div>
              </div>

              {/* Next Available Date */}
              <div className="flex items-center space-x-1.5 mb-3 text-gray-600">
                <div className="p-1 bg-green-50 rounded-lg">
                  <Calendar className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-sm font-medium">{getNextAvailableDate(tour)}</span>
              </div>

              {/* Side Locations Preview */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    try {
                      const locations = getSideLocations(tour) || [];
                      return (
                        <>
                          {locations.slice(0, 2).map((location, index) => (
                            <span key={index} className="px-2.5 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                              {location}
                            </span>
                          ))}
                          {locations.length > 2 && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
                              +{locations.length - 2} more
                            </span>
                          )}
                        </>
                      );
                    } catch (error) {
                      console.error('Error rendering side locations in card:', error);
                      return <span className="text-red-500 text-xs">Error loading locations</span>;
                    }
                  })()}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-gray-900">₱{tour.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-500 font-medium">per pax</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-5">
                <div className="flex items-center space-x-1.5">
                  <div className="p-1 bg-orange-50 rounded-lg">
                    <Users className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <span className="font-medium">{tour.bookings || 0} bookings</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="p-1 bg-emerald-50 rounded-lg">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="font-medium">₱{(tour.revenue || 0).toLocaleString()}</span>
                </div>
              </div>
                            
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewTour(tour)}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleEditTour(tour)}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 font-medium border border-blue-200 hover:border-blue-300"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteTour(tour)}
                  className="px-3 py-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-200 font-medium border border-red-200 hover:border-red-300"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] shadow-2xl flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="bg-gradient-to-r bg-[#154689] p-6 text-white rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {editingTour ? <Edit3 className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {editingTour ? 'Edit Tour Package' : 'Create New Tour'}
                    </h3>
                    <p className="text-blue-100 mt-1">
                      {editingTour ? 'Update your tour details' : 'Fill in the details for your new tour'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Destination *
                      </label>
                      <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter destination name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Price (PHP) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Duration (Days) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nights *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.nights}
                        onChange={(e) => setFormData({ ...formData, nights: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Tour Type *
                      </label>
                      <select
                        value={formData.tour_type}
                        onChange={(e) => setFormData({ ...formData, tour_type: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="Domestic">Domestic</option>
                        <option value="International">International</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Media Section with Drag & Drop */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Image className="h-5 w-5 text-green-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Media</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Cover Image *
                    </label>
                    
                    {/* Drag & Drop Area */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple // ✅
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />

                      
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 relative">
                              <div className="w-full h-full rounded-full border-4 border-blue-200"></div>
                              <div 
                                className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
                                style={{
                                  transform: `rotate(${uploadProgress * 3.6}deg)`
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                          </div>
                        </div>
                      )}

                      {formData.image_url.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {formData.image_url.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    image_url: prev.image_url.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            {isDragging ? 'Drop your image here' : 'Upload cover image'}
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            Drag and drop an image, or click to browse
                          </p>
                          <p className="text-xs text-gray-400">
                            Supports: JPG, PNG, GIF, WebP (Max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {imageError && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">{imageError}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Locations & Inclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-gray-900">Destinations</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Side Locations
                      </label>
                      <div className="space-y-3">
                        {sideLocationInputs.map((location, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => updateSideLocationInput(index, e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter location"
                            />
                            <button
                              type="button"
                              onClick={() => removeSideLocationInput(index)}
                              disabled={sideLocationInputs.length === 1}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addSideLocationInput}
                          className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Location</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="text-lg font-semibold text-gray-900">Inclusions</h4>
                    </div>
                    {inclusionInputs.map((inclusion, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-2 mb-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Inclusion</label>
                            <input
                              type="text"
                              value={inclusion.item}
                              onChange={(e) => updateInclusionInput(index, 'item', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Hotel + Daily Tour"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeInclusionInput(index)}
                            disabled={inclusionInputs.length === 1}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-5"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Note (Optional)</label>
                          <input
                            type="text"
                            value={inclusion.note || ''}
                            onChange={(e) => updateInclusionInput(index, 'note', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Tours only, no transfer"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addInclusionInput}
                      className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Inclusion</span>
                    </button>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Schedule</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Available Dates
                    </label>
                    <div className="space-y-4">
                      {dateRangeInputs.map((dateRange, index) => (
                        <div key={index} className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                              <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => updateDateRangeInput(index, 'start', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">End Date</label>
                              <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => updateDateRangeInput(index, 'end', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Available Slots</label>
                              <input
                                type="number"
                                min="1"
                                value={dateRange.slots}
                                onChange={(e) => updateDateRangeInput(index, 'slots', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDateRangeInput(index)}
                            disabled={dateRangeInputs.length === 1}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDateRangeInput}
                        className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Date Range</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Itinerary */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Itinerary</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tour Itinerary *
                    </label>
                    <textarea
                      value={formData.itinerary}
                      onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      rows={6}
                      placeholder="Day 1: Arrival and check-in...&#10;Day 2: City tour and activities...&#10;Day 3: Departure"
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Filter className="h-5 w-5 text-gray-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Status</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Publication Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="archived">Draft - Not visible to customers</option>
                      <option value="active">active - Available for booking</option>
                      <option value="inactive">inactive - Not available for booking</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  * Required fields
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r bg-[#154689] text-white rounded-xl hover:bg-[#4C76B1] hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>{editingTour ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <>
                        {editingTour ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        <span>{editingTour ? 'Update Tour' : 'Create Tour'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingTour && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r bg-[#154689] p-6 text-white">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingTour(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <MapPin className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {getDestination(viewingTour)}
                  </h3>
                  <p className="text-blue-100 mt-1">Tour Package Details</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6 space-y-8">
                {/* Hero Section */}
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={getImageUrl(viewingTour)}
                    alt={getDestination(viewingTour)}
                    className="w-full h-48 object-cover rounded-lg  opacity-50"
                    onError={(e) => {
                      e.currentTarget.src = "/api/placeholder/800/400";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="text-white">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-3xl font-bold">
                          ₱{(viewingTour?.price || 0).toLocaleString()}
                        </span>
                        <span className="text-lg text-gray-200">per person</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{viewingTour?.duration || 1} days</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Moon className="h-4 w-4" />
                          <span>{viewingTour?.nights || 1} nights</span>
                        </div>
                        {(viewingTour?.rating && viewingTour.rating > 0) && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{viewingTour.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-4 py-2 text-sm font-medium rounded-full backdrop-blur-sm ${
                        viewingTour?.tour_type === 'International' ? 'bg-blue-500/90 text-white' : 'bg-purple-500/90 text-white'
                      }`}>
                        {viewingTour?.tour_type || 'Domestic'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Bookings</p>
                        <p className="text-2xl font-bold text-blue-900">{viewingTour?.bookings || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-500 rounded-lg">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Revenue</p>
                        <p className="text-2xl font-bold text-green-900">₱{(viewingTour?.revenue || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Next Date</p>
                        <p className="text-lg font-bold text-purple-900">
                          {(() => {
                            try {
                              return getNextAvailableDate(viewingTour) || 'No dates available';
                            } catch (error) {
                              console.error('Error getting next available date:', error);
                              return 'Error loading date';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Side Locations */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h5 className="text-lg font-semibold text-gray-900">Destinations</h5>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            if (!viewingTour) return <span className="text-red-500">No tour data available</span>;
                            
                            const sideLocations = getSideLocations(viewingTour);
                            return sideLocations && sideLocations.length > 0 ? (
                              sideLocations.map((location, index) => (
                                <span key={index} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                                  {location}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 italic">No destinations specified</span>
                            );
                          } catch (error) {
                            console.error('Error rendering side locations:', error);
                            return <span className="text-red-500">Error loading destinations</span>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Inclusions */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-green-600" />
                      <h5 className="text-lg font-semibold text-gray-900">What's Included</h5>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            if (!viewingTour) return <span className="text-red-500">No tour data available</span>;
                            
                            const inclusions = getInclusions(viewingTour);
                            return inclusions && inclusions.length > 0 ? (
                              inclusions.map((inclusion, index) => (
                                <span key={index} className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                                  {inclusion}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 italic">No inclusions specified</span>
                            );
                          } catch (error) {
                            console.error('Error rendering inclusions:', error);
                            return <span className="text-red-500">Error loading inclusions</span>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Dates */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <h5 className="text-lg font-semibold text-gray-900">Available Dates</h5>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {(() => {
                      try {
                        if (!viewingTour) return <p className="text-red-500 text-center py-8">No tour data available</p>;
                        
                        const availableDates = getAvailableDates(viewingTour);
                        return availableDates && availableDates.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {availableDates.map((dateRange: any, index: number) => (
                              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {(() => {
                                        try {
                                          return formatDateRange(dateRange);
                                        } catch (error) {
                                          console.error('Error formatting date range:', error);
                                          return 'Invalid date range';
                                        }
                                      })()}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {dateRange?.remaining_slots || 0} slots remaining
                                    </p>
                                  </div>
                                  <div className={`w-3 h-3 rounded-full ${
                                    (dateRange?.remaining_slots || 0) > 10 ? 'bg-green-500' :
                                    (dateRange?.remaining_slots || 0) > 5 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic text-center py-8">No available dates</p>
                        );
                      } catch (error) {
                        console.error('Error rendering available dates:', error);
                        return <p className="text-red-500 text-center py-8">Error loading available dates</p>;
                      }
                    })()}
                  </div>
                </div>

                {/* Itinerary */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <h5 className="text-lg font-semibold text-gray-900">Itinerary</h5>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          try {
                            if (!viewingTour) return 'No tour data available';
                            return getItinerary(viewingTour) || 'No itinerary provided';
                          } catch (error) {
                            console.error('Error rendering itinerary:', error);
                            return 'Error loading itinerary';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal - Show when viewingTour is invalid */}
      {showViewModal && !viewingTour && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Tour Data</h3>
              <p className="text-sm text-gray-500 mb-4">
                The tour information could not be loaded. Please try again.
              </p>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
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

      {/* Confirm Save Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Save
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {editingTour ? 'update' : 'create'} this tour?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSave}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-[#154689] text-white hover:bg-[#4C76B1] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Success!
            </h3>
            <p className="text-gray-600 mb-6">
              Tour has been saved successfully.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-6 py-2 bg-[#154689] text-white rounded-lg hover:bg-[#4C76B1]"
            >
              OK
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default ToursManagement;