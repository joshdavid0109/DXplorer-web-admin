import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  Download,
  X,
  Save,
  User,
  Star,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Adjust the import path as necessary

interface Agent {
  profile_id?: number;
  user_id?: string;
  first_name: string;
  last_name: string;
  contact_number?: string;
  email_address: string;
  profile_photo?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  hire_date?: string;
  commission_rate?: number;
  total_bookings?: number;
  total_revenue?: number;
  avg_rating?: number;
  created_at?: string;
  last_active?: string;
  promo_id?: number;
  promo_code?: string;
  discount_rate?: number;
  promo_expiry?: string;
  promo_status?: 'active' | 'inactive' | 'expired';
  role?: 'agent' | 'manager';
  manager_id?: string | null;
}

const AgentManagement: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state
const [formData, setFormData] = useState<Agent>({
  first_name: '',
  last_name: '',
  email_address: '',
  contact_number: '',
  profile_photo: null,
  status: 'active',
  department: '',
  commission_rate: 5,
  promo_code: '',
  discount_rate: 10,
  promo_expiry: '',
  promo_status: 'active',
  role: 'agent',        // NEW
  manager_id: null      // NEW
});

  
const generatePromoCode = (firstName: string, lastName: string, discountRate: number = 10) => {
  const cleanFirstName = firstName.replace(/[^a-zA-Z]/g, '').slice(0, 4);
  const cleanLastName = lastName.replace(/[^a-zA-Z]/g, '');
  const lastNameCode = cleanLastName.length > 0 ? cleanLastName.charAt(0) + 'DX' : 'DX';
  
  return `${cleanFirstName}${lastNameCode}Explorer${discountRate}`;
};

const [managers, setManagers] = useState<Agent[]>([]);

const fetchManagers = async () => {
  const { data } = await supabase
    .from('users')
    .select('user_id')
    .eq('role', 'manager');

  if (!data) return setManagers([]);

  // Load profiles for managers
  const { data: profiles } = await supabase
    .from('agents')
    .select('*')
    .in('user_id', data.map(u => u.user_id));

  setManagers(profiles || []);
};

  // Fetch agents
const fetchAgents = async () => {
  try {
    setLoading(true);
    
    // Get all promos first (since we only want users with promos)
    const { data: promosData, error: promosError } = await supabase
      .from('promos')
      .select('*');
    
    if (promosError) {
      console.error('Promos error:', promosError);
      throw promosError;
    }
    
    console.log('All promos:', promosData);
    
    if (!promosData || promosData.length === 0) {
      setAgents([]);
      return;
    }
    
    // Get user IDs from promos
    const promoUserIds = promosData.map(promo => promo.user_id);
    
    // Get profiles only for users who have promos
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_id', promoUserIds)
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error('Profiles error:', profilesError);
      throw profilesError;
    }
    
    console.log('Profiles with promos:', profilesData);
    
    // Get users data for these profiles
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('user_id, status, role')
      .in('user_id', promoUserIds);
    
    if (usersError) {
      console.error('Users error:', usersError);
      // Don't throw here, just log and continue with empty users data
    }
    
    console.log('Users with promos:', usersData);
    
    // Transform and combine the data
    const transformedData = profilesData?.map(profile => {
      // Find the matching user data
      const userData = usersData?.find(user => user.user_id === profile.user_id);
      // Find the matching promo data
      const promoData = promosData?.find(promo => promo.user_id === profile.user_id);
      
      return {
        ...profile,
        // Add user data with fallbacks
        status: userData?.status || 'active',
        role: userData?.role || 'agent',
        // Add promo data with fallbacks
        promo_id: promoData?.promo_id || undefined,
        promo_code: promoData?.promo_code || undefined,
        discount_rate: promoData?.discount_rate || undefined,
        promo_expiry: promoData?.promo_expiry || undefined,
        promo_status: promoData?.status || undefined
      };
    }) || [];
    
    console.log('Final transformed data:', transformedData);
    
    setAgents(transformedData);
    
  } catch (error) {
    console.error('Error fetching agents:', error);
    // Set empty array on error to prevent UI breaking
    setAgents([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchManagers();
    fetchAgents();
  }, []);

  useEffect(() => {
    if (formData.first_name && formData.last_name && !editingAgent) {
      const generatedPromoCode = generatePromoCode(
        formData.first_name, 
        formData.last_name, 
        formData.discount_rate || 10
      );
      setFormData(prev => ({ ...prev, promo_code: generatedPromoCode }));
    }
  }, [formData.first_name, formData.last_name, formData.discount_rate, editingAgent]);

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      (agent.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.email_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.contact_number || '').includes(searchTerm) ||
      (agent.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.promo_code || '').toLowerCase().includes(searchTerm.toLowerCase()); // Add this line
    
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        // Update existing agent
        const { status, promo_code, discount_rate, promo_expiry, promo_status, ...profileData } = formData;
        
        // Update user_profiles table
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            ...profileData,
            hire_date: profileData.hire_date || new Date().toISOString().split('T')[0]
          })
          .eq('profile_id', editingAgent.profile_id);
        
        if (profileError) throw profileError;
        
        // Update status in users table
        const { error: statusError } = await supabase
          .from('users')
          .update({ status })
          .eq('user_id', editingAgent.user_id);
        
        if (statusError) throw statusError;
        
        // Update or create promo
        if (promo_code) {
          const promoData = {
            user_id: editingAgent.user_id,
            promo_code,
            discount_rate: discount_rate || 10,
            promo_expiry: promo_expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: promo_status || 'active'
          };
          
          if (editingAgent.promo_id) {
            // Update existing promo
            const { error: promoError } = await supabase
              .from('promos')
              .update(promoData)
              .eq('promo_id', editingAgent.promo_id);
            
            if (promoError) throw promoError;
          } else {
            // Create new promo
            const { error: promoError } = await supabase
              .from('promos')
              .insert([promoData]);
            
            if (promoError) throw promoError;
          }
        }
        
      } else {
        // Create new agent (similar updates for create flow)
        const { status, promo_code, discount_rate, promo_expiry, promo_status, ...profileData } = formData;
        
        // Create user first to get user_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            email: formData.email_address,
            status: status,
            role: 'agent'
          }])
          .select('user_id')
          .single();
        
        if (userError) throw userError;
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            ...profileData,
            user_id: userData.user_id,
            hire_date: profileData.hire_date || new Date().toISOString().split('T')[0]
          }]);
        
        if (profileError) throw profileError;
        
        // Create promo if promo_code exists
        if (promo_code && userData.user_id) {
          const { error: promoError } = await supabase
            .from('promos')
            .insert([{
              user_id: userData.user_id,
              promo_code,
              discount_rate: discount_rate || 10,
              promo_expiry: promo_expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: promo_status || 'active'
            }]);
          
          if (promoError) throw promoError;
        }
      }
      
      handleCloseModal();
      await fetchAgents();
    } catch (error) {
      console.error('Error saving agent:', error);
    }
  };
    
  // Handle delete
  const handleDelete = async (profileId: number) => {
    if (!profileId) {
      console.error('No profile_id provided');
      alert('Cannot delete: No profile ID found');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        console.log('Attempting to delete profile_id:', profileId);
        
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .eq('profile_id', profileId);
        
        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
        
        console.log('Agent deleted successfully');
        await fetchAgents(); // Refresh the list
        
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert(`Error deleting agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Modal handlers
const handleOpenModal = (agent?: Agent) => {
  if (agent) {
    setEditingAgent(agent);
    setFormData(agent);
  } else {
    setEditingAgent(null);
    setFormData({
      first_name: '',
      last_name: '',
      email_address: '',
      contact_number: '',
      profile_photo: null,
      status: 'active',
      department: '',
      commission_rate: 5,
      promo_code: '', // Add this line
    });
  }
  setIsModalOpen(true);
};

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Management</h1>
        <p className="text-gray-600">Manage your agents and track their performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-3xl font-bold text-gray-900">{agents.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-3xl font-bold text-green-600">
                {agents.filter(a => a.status === 'active').length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-purple-600">
                {agents.reduce((sum, a) => sum + (a.total_bookings || 0), 0)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(agents.reduce((sum, a) => sum + (a.total_revenue || 0), 0))}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-3xl font-bold text-yellow-600">
                {agents.length > 0 
                  ? (agents.reduce((sum, a) => sum + (a.avg_rating || 0), 0) / agents.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
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
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'suspended')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
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
              Add Agent
            </button>
          </div>
        </div>
      </div>

      {/* Agent Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promo Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAgents.map((agent) => (
                <tr key={agent.profile_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {agent.first_name} {agent.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {agent.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center gap-1 mb-1">
                        <Mail className="h-3 w-3" />
                        {agent.email_address}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {agent.contact_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        agent.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : agent.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-mono bg-blue-50 text-blue-800 rounded border">
                        {agent.promo_code || 'N/A'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {agent.discount_rate || 10}% off packages
                      </div>
                      {agent.promo_expiry && (
                        <div className="text-xs text-gray-400">
                          Expires: {formatDate(agent.promo_expiry)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="mb-1">{agent.total_bookings || 0} bookings</div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(agent.total_revenue || 0)} revenue
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 text-yellow-400" />
                        {(agent.avg_rating || 0).toFixed(1)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.commission_rate || 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.hire_date ? formatDate(agent.hire_date) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(agent)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.profile_id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                  {Math.min(currentPage * itemsPerPage, filteredAgents.length)}
                </span> of{' '}
                <span className="font-medium">{filteredAgents.length}</span> results
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
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => setFormData({...formData, email_address: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code
                </label>
                <input
                  type="text"
                  value={formData.promo_code || ''}
                  onChange={(e) => setFormData({...formData, promo_code: e.target.value})}
                  placeholder="Auto-generated or custom code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_rate || 10}
                  onChange={(e) => setFormData({...formData, discount_rate: parseInt(e.target.value) || 10})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.promo_expiry || ''}
                  onChange={(e) => setFormData({...formData, promo_expiry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Status
                </label>
                <select
                  value={formData.promo_status || 'active'}
                  onChange={(e) => setFormData({...formData, promo_status: e.target.value as 'active' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'suspended'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="e.g., Sales, Support, Operations"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commission_rate || 5}
                    onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingAgent ? 'Update Agent' : 'Add Agent'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AgentManagement;

                    