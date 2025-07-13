import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Star, 
  Image as ImageIcon,
  Save,
  X,
  Upload,
  Minus,
  Settings,
  Copy,
  MoreHorizontal,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';

// Types
interface Tour {
  id: string;
  destination: string;
  imageUrl: string;
  price: number;
  rating: number;
  itinerary: string;
  sideLocations: string[];
  inclusions: string[];
  availableDates: string[];
  packageId: string;
  status: 'active' | 'inactive' | 'draft';
  bookingsCount: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

interface TourFormData {
  destination: string;
  imageUrl: string;
  price: number;
  itinerary: string;
  sideLocations: string[];
  inclusions: string[];
  availableDates: string[];
  packageId: string;
  status: 'active' | 'inactive' | 'draft';
}

// Sample data
const sampleTours: Tour[] = [
  {
    id: '1',
    destination: 'Bali Beach Paradise',
    imageUrl: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800',
    price: 25000,
    rating: 4.8,
    itinerary: 'Experience the pristine beaches and vibrant culture of Bali. This 5-day tour includes visits to iconic temples, traditional villages, and stunning coastal areas.',
    sideLocations: ['Tanah Lot Temple', 'Ubud Rice Terraces', 'Kuta Beach', 'Seminyak'],
    inclusions: ['Accommodation', 'Meals', 'Transportation', 'Tour Guide', 'Entrance Fees'],
    availableDates: ['2024-08-15', '2024-08-22', '2024-08-29', '2024-09-05'],
    packageId: 'BALI001',
    status: 'active',
    bookingsCount: 156,
    revenue: 3900000,
    createdAt: '2024-06-01',
    updatedAt: '2024-07-10'
  },
  {
    id: '2',
    destination: 'Tokyo City Adventure',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    price: 45000,
    rating: 4.9,
    itinerary: 'Discover the bustling metropolis of Tokyo with its perfect blend of traditional and modern culture. Visit iconic landmarks and experience authentic Japanese cuisine.',
    sideLocations: ['Shibuya Crossing', 'Senso-ji Temple', 'Tokyo Skytree', 'Harajuku'],
    inclusions: ['Accommodation', 'Breakfast', 'Transportation', 'Tour Guide', 'Cultural Activities'],
    availableDates: ['2024-08-20', '2024-08-27', '2024-09-03', '2024-09-10'],
    packageId: 'TOKYO001',
    status: 'active',
    bookingsCount: 134,
    revenue: 6030000,
    createdAt: '2024-05-15',
    updatedAt: '2024-07-08'
  },
  {
    id: '3',
    destination: 'Swiss Alps Trek',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    price: 65000,
    rating: 4.7,
    itinerary: 'Embark on an unforgettable mountain adventure through the Swiss Alps. Experience breathtaking views, alpine villages, and pristine nature.',
    sideLocations: ['Matterhorn', 'Jungfraujoch', 'Lake Geneva', 'Zermatt'],
    inclusions: ['Accommodation', 'All Meals', 'Mountain Transportation', 'Equipment', 'Professional Guide'],
    availableDates: ['2024-08-18', '2024-08-25', '2024-09-01', '2024-09-08'],
    packageId: 'SWISS001',
    status: 'active',
    bookingsCount: 89,
    revenue: 5785000,
    createdAt: '2024-05-20',
    updatedAt: '2024-07-05'
  }
];

const defaultFormData: TourFormData = {
  destination: '',
  imageUrl: '',
  price: 0,
  itinerary: '',
  sideLocations: [''],
  inclusions: [''],
  availableDates: [''],
  packageId: '',
  status: 'draft'
};

const ToursManagement: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>(sampleTours);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [formData, setFormData] = useState<TourFormData>(defaultFormData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);

  // Filter tours
  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tour.packageId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (type: 'add' | 'edit' | 'view', tour?: Tour) => {
    setModalType(type);
    if (tour) {
      setSelectedTour(tour);
      setFormData({
        destination: tour.destination,
        imageUrl: tour.imageUrl,
        price: tour.price,
        itinerary: tour.itinerary,
        sideLocations: tour.sideLocations,
        inclusions: tour.inclusions,
        availableDates: tour.availableDates,
        packageId: tour.packageId,
        status: tour.status
      });
    } else {
      setSelectedTour(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTour(null);
    setFormData(defaultFormData);
  };

  const handleSaveTour = () => {
    if (modalType === 'add') {
      const newTour: Tour = {
        id: Date.now().toString(),
        destination: formData.destination,
        imageUrl: formData.imageUrl,
        price: formData.price,
        rating: 0,
        itinerary: formData.itinerary,
        sideLocations: formData.sideLocations.filter(loc => loc.trim() !== ''),
        inclusions: formData.inclusions.filter(inc => inc.trim() !== ''),
        availableDates: formData.availableDates.filter(date => date.trim() !== ''),
        packageId: formData.packageId,
        status: formData.status,
        bookingsCount: 0,
        revenue: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setTours([...tours, newTour]);
    } else if (modalType === 'edit' && selectedTour) {
      setTours(tours.map(tour => 
        tour.id === selectedTour.id 
          ? {
              ...tour,
              destination: formData.destination,
              imageUrl: formData.imageUrl,
              price: formData.price,
              itinerary: formData.itinerary,
              sideLocations: formData.sideLocations.filter(loc => loc.trim() !== ''),
              inclusions: formData.inclusions.filter(inc => inc.trim() !== ''),
              availableDates: formData.availableDates.filter(date => date.trim() !== ''),
              packageId: formData.packageId,
              status: formData.status,
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : tour
      ));
    }
    handleCloseModal();
  };

  const handleDeleteTour = (tourId: string) => {
    setTourToDelete(tourId);
    setShowDeleteModal(true);
  };

  const confirmDeleteTour = () => {
    if (tourToDelete) {
      setTours(tours.filter(tour => tour.id !== tourToDelete));
      setShowDeleteModal(false);
      setTourToDelete(null);
    }
  };

  const handleDuplicateTour = (tour: Tour) => {
    const duplicatedTour: Tour = {
      ...tour,
      id: Date.now().toString(),
      destination: `${tour.destination} (Copy)`,
      packageId: `${tour.packageId}_COPY`,
      status: 'draft',
      bookingsCount: 0,
      revenue: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setTours([...tours, duplicatedTour]);
  };

  const addArrayItem = (field: keyof Pick<TourFormData, 'sideLocations' | 'inclusions' | 'availableDates'>) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: keyof Pick<TourFormData, 'sideLocations' | 'inclusions' | 'availableDates'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof Pick<TourFormData, 'sideLocations' | 'inclusions' | 'availableDates'>, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Check className="h-4 w-4" />;
      case 'inactive':
        return <X className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tours Management</h1>
          <p className="text-gray-600">Manage your tour packages and destinations</p>
        </div>
        <button
          onClick={() => handleOpenModal('add')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Tour</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tours by destination or package ID..."
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTours.map((tour) => (
          <div key={tour.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Tour Image */}
            <div className="relative h-48 bg-gray-200">
              <img
                src={tour.imageUrl}
                alt={tour.destination}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tour.status)}`}>
                  {getStatusIcon(tour.status)}
                  <span>{tour.status}</span>
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{tour.rating}</span>
                </div>
              </div>
            </div>

            {/* Tour Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">{tour.destination}</h3>
                <span className="text-sm text-gray-500">#{tour.packageId}</span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tour.itinerary}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{tour.bookingsCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>₱{tour.revenue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">₱{(tour.price || 0).toLocaleString()}</span>
                  <p className="text-xs text-gray-500">per person</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenModal('view', tour)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal('edit', tour)}
                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit Tour"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTour(tour)}
                    className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Duplicate Tour"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTour(tour.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Tour"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  Updated {new Date(tour.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTours.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tours found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first tour package'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => handleOpenModal('add')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Tour</span>
            </button>
          )}
        </div>
      )}

      {/* Tour Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {modalType === 'add' ? 'Add New Tour' : 
                 modalType === 'edit' ? 'Edit Tour' : 'Tour Details'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination Name *
                    </label>
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bali Beach Paradise"
                      disabled={modalType === 'view'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Package ID *
                    </label>
                    <input
                      type="text"
                      value={formData.packageId}
                      onChange={(e) => setFormData(prev => ({ ...prev, packageId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., BALI001"
                      disabled={modalType === 'view'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (PHP) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="25000"
                      disabled={modalType === 'view'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={modalType === 'view'}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                      disabled={modalType === 'view'}
                    />
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Itinerary Description *
                    </label>
                    <textarea
                      value={formData.itinerary}
                      onChange={(e) => setFormData(prev => ({ ...prev, itinerary: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the tour experience..."
                      disabled={modalType === 'view'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Side Locations
                    </label>
                    <div className="space-y-2">
                      {formData.sideLocations.map((location, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => updateArrayItem('sideLocations', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Tanah Lot Temple"
                            disabled={modalType === 'view'}
                          />
                          {modalType !== 'view' && (
                            <button
                              onClick={() => removeArrayItem('sideLocations', index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {modalType !== 'view' && (
                        <button
                          onClick={() => addArrayItem('sideLocations')}
                          className="flex items-center space-x-2 px-3 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Location</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inclusions
                    </label>
                    <div className="space-y-2">
                      {formData.inclusions.map((inclusion, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={inclusion}
                            onChange={(e) => updateArrayItem('inclusions', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Accommodation"
                            disabled={modalType === 'view'}
                          />
                          {modalType !== 'view' && (
                            <button
                              onClick={() => removeArrayItem('inclusions', index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {modalType !== 'view' && (
                        <button
                          onClick={() => addArrayItem('inclusions')}
                          className="flex items-center space-x-2 px-3 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Inclusion</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Dates
                    </label>
                    <div className="space-y-2">
                      {formData.availableDates.map((date, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => updateArrayItem('availableDates', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={modalType === 'view'}
                          />
                          {modalType !== 'view' && (
                            <button
                              onClick={() => removeArrayItem('availableDates', index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {modalType !== 'view' && (
                        <button
                          onClick={() => addArrayItem('availableDates')}
                          className="flex items-center space-x-2 px-3 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Date</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/*