import React, { useState } from 'react';
import { MapPin, Edit3, Eye, Plus, Search, Filter, Star, Calendar, DollarSign, Users, Trash2, Image, X } from 'lucide-react';

interface Tour {
  id: number;
  destination: string;
  price: number;
  rating: number;
  imageUrl: string;
  itinerary: string;
  sideLocations: string[];
  inclusions: string[];
  availableDates: string[];
  bookings: number;
  revenue: number;
  status: 'active' | 'inactive' | 'draft';
}

interface TourFormData {
  destination: string;
  price: number;
  imageUrl: string;
  itinerary: string;
  sideLocations: string[];
  inclusions: string[];
  availableDates: string[];
  status: 'active' | 'inactive' | 'draft';
}

const ToursManagement: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([
    {
      id: 1,
      destination: 'Bali Beach Paradise',
      price: 25000,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400',
      itinerary: 'Experience the ultimate beach getaway with pristine white sand beaches, crystal clear waters, and stunning sunsets. This 5-day tour includes visits to famous temples, traditional markets, and authentic Balinese cuisine.',
      sideLocations: ['Tanah Lot Temple', 'Ubud Rice Terraces', 'Kuta Beach', 'Monkey Forest Sanctuary'],
      inclusions: ['Hotel Accommodation', 'All Meals', 'Transportation', 'Tour Guide', 'Entrance Fees'],
      availableDates: ['2024-08-15', '2024-08-22', '2024-08-29', '2024-09-05'],
      bookings: 156,
      revenue: 3900000,
      status: 'active'
    },
    {
      id: 2,
      destination: 'Tokyo City Adventure',
      price: 35000,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      itinerary: 'Discover the vibrant culture of Tokyo with visits to traditional shrines, modern districts, and authentic cuisine experiences. This 7-day adventure combines historical sites with contemporary attractions.',
      sideLocations: ['Shibuya Crossing', 'Senso-ji Temple', 'Tokyo Skytree', 'Harajuku District'],
      inclusions: ['Hotel Accommodation', 'Breakfast', 'Transportation', 'Tour Guide', 'Cultural Activities'],
      availableDates: ['2024-08-10', '2024-08-17', '2024-08-24', '2024-08-31'],
      bookings: 134,
      revenue: 4690000,
      status: 'active'
    },
    {
      id: 3,
      destination: 'Swiss Alps Trek',
      price: 45000,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      itinerary: 'Embark on a breathtaking journey through the Swiss Alps with guided treks, mountain cable car rides, and stays in cozy alpine lodges. Perfect for adventure seekers and nature lovers.',
      sideLocations: ['Matterhorn', 'Jungfraujoch', 'Lake Geneva', 'Zermatt Village'],
      inclusions: ['Lodge Accommodation', 'All Meals', 'Trekking Equipment', 'Mountain Guide', 'Cable Car Tickets'],
      availableDates: ['2024-08-12', '2024-08-19', '2024-08-26', '2024-09-02'],
      bookings: 89,
      revenue: 4005000,
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [viewingTour, setViewingTour] = useState<Tour | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState<TourFormData>({
    destination: '',
    price: 0,
    imageUrl: '',
    itinerary: '',
    sideLocations: [],
    inclusions: [],
    availableDates: [],
    status: 'draft'
  });

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddTour = () => {
    setEditingTour(null);
    setFormData({
      destination: '',
      price: 0,
      imageUrl: '',
      itinerary: '',
      sideLocations: [],
      inclusions: [],
      availableDates: [],
      status: 'draft'
    });
    setShowModal(true);
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    setFormData({
      destination: tour.destination,
      price: tour.price,
      imageUrl: tour.imageUrl,
      itinerary: tour.itinerary,
      sideLocations: tour.sideLocations,
      inclusions: tour.inclusions,
      availableDates: tour.availableDates,
      status: tour.status
    });
    setShowModal(true);
  };

  const handleViewTour = (tour: Tour) => {
    setViewingTour(tour);
    setShowViewModal(true);
  };

  const handleDeleteTour = (tourId: number) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      setTours(tours.filter(tour => tour.id !== tourId));
    }
  };

  const handleSubmit = () => {
    
    if (editingTour) {
      // Update existing tour
      setTours(tours.map(tour => 
        tour.id === editingTour.id 
          ? { ...tour, ...formData }
          : tour
      ));
    } else {
      // Add new tour
      const newTour: Tour = {
        id: Math.max(...tours.map(t => t.id)) + 1,
        ...formData,
        rating: 0,
        bookings: 0,
        revenue: 0
      };
      setTours([...tours, newTour]);
    }
    
    setShowModal(false);
  };

  const handleArrayInput = (value: string, field: 'sideLocations' | 'inclusions' | 'availableDates') => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({ ...formData, [field]: items });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tours Management</h2>
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTours.map((tour) => (
          <div key={tour.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <img
                src={tour.imageUrl}
                alt={tour.destination}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tour.status)}`}>
                  {tour.status}
                </span>
              </div>
              {tour.rating > 0 && (
                <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  <Star className="h-3 w-3 fill-current text-yellow-400" />
                  <span className="text-sm">{tour.rating}</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{tour.destination}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tour.itinerary}</p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-gray-900">₱{tour.price.toLocaleString()}</span>
                <span className="text-sm text-gray-500">per pax</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{tour.bookings} bookings</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>₱{tour.revenue.toLocaleString()}</span>
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Itinerary
                  </label>
                  <textarea
                    value={formData.itinerary}
                    onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                    rows={3}
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
                    value={formData.sideLocations.join(', ')}
                    onChange={(e) => handleArrayInput(e.target.value, 'sideLocations')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Temple A, Beach B, Mountain C"
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
                    placeholder="Hotel, Meals, Transportation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Dates (comma-separated, YYYY-MM-DD)
                  </label>
                  <input
                    type="text"
                    value={formData.availableDates.join(', ')}
                    onChange={(e) => handleArrayInput(e.target.value, 'availableDates')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2024-08-15, 2024-08-22, 2024-08-29"
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
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {editingTour ? 'Update Tour' : 'Create Tour'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              
              <div className="space-y-4">
                <img
                  src={viewingTour.imageUrl}
                  alt={viewingTour.destination}
                  className="w-full h-48 object-cover rounded-lg"
                />
                
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold">{viewingTour.destination}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingTour.status)}`}>
                    {viewingTour.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-semibold">₱{viewingTour.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span className="font-semibold">{viewingTour.rating}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bookings</p>
                    <p className="font-semibold">{viewingTour.bookings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="font-semibold">₱{viewingTour.revenue.toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-2">Description</h5>
                  <p className="text-gray-700">{viewingTour.itinerary}</p>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-2">Included Locations</h5>
                  <div className="flex flex-wrap gap-2">
                    {viewingTour.sideLocations.map((location, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-2">Inclusions</h5>
                  <div className="flex flex-wrap gap-2">
                    {viewingTour.inclusions.map((inclusion, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        {inclusion}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-2">Available Dates</h5>
                  <div className="flex flex-wrap gap-2">
                    {viewingTour.availableDates.map((date, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditTour(viewingTour);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Edit Tour
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToursManagement;