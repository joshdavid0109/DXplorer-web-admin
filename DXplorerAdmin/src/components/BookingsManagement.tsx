import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Filter,
  Download,
  Eye,
  X,
  Save,
  User,
  Package,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Booking {
  booking_id: number;
  package_id?: number;
  date_id?: number;
  num_guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  user_id: string;
  end_date?: string;
  start_date?: string;
  booking_ref: string;
  payment_id?: number;
  // Joined data
  customer_name?: string;
  customer_email?: string;
  package_name?: string;
  package_price?: number;
  payment_status?: string;
  payment_amount?: number;
}

interface Package {
  package_id: number;
  package_name: string;
  price: number;
  main_location?: string;
}

interface Customer {
  user_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
}

const BookingsManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState<Partial<Booking>>({
    user_id: '',
    package_id: undefined,
    num_guests: 1,
    start_date: '',
    end_date: '',
    status: 'pending',
    booking_ref: ''
  });

  // Generate booking reference
  const generateBookingRef = () => {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  // Fetch bookings with related data
 const fetchBookings = async () => {
  try {
    setLoading(true);
    
    // First, fetch all bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      setBookings([]);
      return;
    }

    // Then fetch customers and packages separately
    const { data: customersData } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email_address');

    const { data: packagesData } = await supabase
      .from('packages')
      .select('package_id, package_name, price, main_location');

    // Create lookup maps
    const customersMap = new Map();
    customersData?.forEach(customer => {
      customersMap.set(customer.user_id, customer);
    });

    const packagesMap = new Map();
    packagesData?.forEach(pkg => {
      packagesMap.set(pkg.package_id, pkg);
    });

    // Combine the data
    const transformedBookings = bookingsData?.map(booking => {
      const customer = customersMap.get(booking.user_id);
      const packageInfo = booking.package_id ? packagesMap.get(booking.package_id) : null;

      
      return {
        ...booking,
        customer_name: customer 
          ? `${customer.first_name} ${customer.last_name}`
          : 'Unknown Customer',
        customer_email: customer?.email_address || 'No email',
        package_name: booking.package_id,
        package_price: booking.price || 0
      };
    }) || [];

    setBookings(transformedBookings);
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    setBookings([]);
  } finally {
    setLoading(false);
  }
};

  // Fetch packages
  const fetchPackages = async () => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('package_id, price, main_location')
      .eq('status', 'active');
    
    if (error) {
      console.error('Error fetching packages:', error);
      return;
    }
    
    setPackages(data || []);
  } catch (error) {
    console.error('Error fetching packages:', error);
  }
};

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email_address')
        .order('first_name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchPackages();
    fetchCustomers();
  }, []);

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.booking_ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    const matchesDate = !dateFilter || 
      (booking.start_date && booking.start_date.includes(dateFilter)) ||
      (booking.created_at && booking.created_at.includes(dateFilter));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBooking) {
        // Update existing booking
        const { error } = await supabase
          .from('bookings')
          .update(formData)
          .eq('booking_id', editingBooking.booking_id);
        
        if (error) throw error;
      } else {
        // Create new booking
        const bookingData = {
          ...formData,
          booking_ref: formData.booking_ref || generateBookingRef(),
          created_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('bookings')
          .insert([bookingData]);
        
        if (error) throw error;
      }
      
      handleCloseModal();
      await fetchBookings();
    } catch (error) {
      console.error('Error saving booking:', error);
      alert(`Error saving booking: ${error.message}`);
    }
  };

  // Handle delete
  const handleDelete = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('booking_id', bookingId);
        
        if (error) throw error;
        
        await fetchBookings();
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert(`Error deleting booking: ${error.message}`);
      }
    }
  };

  // Modal handlers
  const handleOpenModal = (booking?: Booking) => {
    if (booking) {
      setEditingBooking(booking);
      setFormData({
        user_id: booking.user_id,
        package_id: booking.package_id,
        num_guests: booking.num_guests,
        start_date: booking.start_date?.split('T')[0] || '',
        end_date: booking.end_date?.split('T')[0] || '',
        status: booking.status,
        booking_ref: booking.booking_ref
      });
    } else {
      setEditingBooking(null);
      setFormData({
        user_id: '',
        package_id: undefined,
        num_guests: 1,
        start_date: '',
        end_date: '',
        status: 'pending',
        booking_ref: generateBookingRef()
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status icon and color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-8xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings Management</h1>
        <p className="text-gray-600">Manage customer bookings and track reservation status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-3xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-3xl font-bold text-red-600">
                {bookings.filter(b => b.status === 'cancelled').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBookings.map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr key={booking.booking_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.booking_ref}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.customer_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{booking.package_name}</div>
                      {booking.package_price && (
                        <div className="text-gray-500">{formatCurrency(booking.package_price)}</div>
                      )}
                    </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>Start: {formatDate(booking.start_date)}</div>
                        <div>End: {formatDate(booking.end_date)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.num_guests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(booking.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(booking)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit booking"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(booking.booking_id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
                </span> of{' '}
                <span className="font-medium">{filteredBookings.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingBooking ? 'Edit Booking' : 'Create New Booking'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Reference
                </label>
                <input
                  type="text"
                  value={formData.booking_ref}
                  onChange={(e) => setFormData({...formData, booking_ref: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.user_id} value={customer.user_id}>
                      {customer.first_name} {customer.last_name} - {customer.email_address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package
                </label>
                <select
                  value={formData.package_id || ''}
                  onChange={(e) => setFormData({...formData, package_id: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a package (optional)</option>
                  {packages.map(pkg => (
                    <option key={pkg.package_id} value={pkg.package_id}>
                      {pkg.package_name || pkg.main_location} - {formatCurrency(pkg.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.num_guests}
                    onChange={(e) => setFormData({...formData, num_guests: parseInt(e.target.value) || 1})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingBooking ? 'Update Booking' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredBookings.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || dateFilter
              ? 'Try adjusting your search criteria'
              : 'Get started by creating a new booking'}
          </p>
          {!searchTerm && statusFilter === 'all' && !dateFilter && (
            <div className="mt-6">
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;