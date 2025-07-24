import React, { useState } from 'react';
import { Calendar, DollarSign, MapPin, Users, Star, Eye, Edit3, Plus, Filter, BarChart3, PieChart, Globe, TrendingUp, Settings, Menu, X, LogOutIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import ToursManagement  from './ToursManagement.tsx';
import { supabase } from '../../lib/supabase';
import CustomerManagement from './CustomerManagement.tsx';
import AgentManagement from './AgentManagement.tsx';

// Types
interface BookingData {
  name: string;
  bookings: number;
  revenue: number;
}

interface TourDistribution {
  name: string;
  value: number;
  color: string;
}

interface RecentBooking {
  id: number;
  customer: string;
  tour: string;
  date: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface TopTour {
  name: string;
  bookings: number;
  revenue: number;
  rating: number;
}

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface NavigationItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  href?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (itemName: string) => void;
  activeItem: string;
}

type TimePeriod = '7d' | '30d' | '90d' | '1y';

// Enhanced Sidebar Component with Navigation
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, activeItem }) => {
  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    { name: 'Bookings', icon: Calendar, href: '/bookings' },
    { name: 'Tours', icon: MapPin, href: '/tours' },
    { name: 'Customers', icon: Users, href: '/customers' },
    { name: 'Agents', icon: TrendingUp, href: '/agents' },
    { name: 'Settings', icon: Settings, href: '/settings' },
    { name: 'Log out', icon: LogOutIcon, href: '/logout'},
  ];

  const handleNavigation = (item: NavigationItem) => {
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      onClose();
    }

    // Handle Logout case
    if (item.name === 'Log out') {
      // Clear session via Supabase
      supabase.auth.signOut().then(() => {
        window.location.href = '/App'; // or '/login' if you have a Login.tsx route
      }).catch((error) => {
        console.error('Logout failed:', error);
      });
      return;
    }

    // Call parent navigation handler for normal items
    onNavigate(item.name);
  };
  

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            {/* This div previously held the Globe icon */}
            <div className="p-2 rounded-lg"> 
              <img 
                src={'../src/assets/logo.png'} // Assuming you have a logo image in your assets
                alt="DXplorer Logo" 
                className="w-full h-auto object-contain max-w-21 max-h-17"  // Tailwind CSS classes for sizing and fit
              />
            </div>

          </div>
          
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeItem === item.name
                    ? 'bg-[#154689] text-[#ffffff] border-r-2 border-[#ffffff]' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );
};

const DashboardFilters: React.FC<{
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  onFilter: () => void;
}> = ({ selectedPeriod, onPeriodChange, onFilter }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value as TimePeriod)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

        </div>
        <button 
          onClick={onFilter}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </button>
      </div>
    </div>
  );
};

const RecentBookings: React.FC<{
  bookings: RecentBooking[];
  onViewAll: () => void;
}> = ({ bookings, onViewAll }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        <button 
          onClick={onViewAll}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          View All
        </button>
      </div>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{booking.customer}</h3>
              <p className="text-sm text-gray-600">{booking.tour}</p>
              <p className="text-xs text-gray-500">{booking.date}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">₱{booking.amount}</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopTours: React.FC<{
  tours: TopTour[];
  onManage: () => void;
}> = ({ tours, onManage }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Top Performing Tours</h2>
        <button 
          onClick={onManage}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          Manage Tours
        </button>
      </div>
      <div className="space-y-4">
        {tours.map((tour, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{tour.name}</h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-600">{tour.bookings} bookings</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{tour.rating}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">₱{tour.revenue.toLocaleString()}</p>
              <div className="flex items-center space-x-2 mt-1">
                <button className="p-1 text-gray-400 hover:text-blue-500">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-green-500">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BookingChart: React.FC<{
  data: BookingData[];
}> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Booking Trends</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Bookings</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Revenue</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip />
          <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={3} />
          <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const TourDistributionChart: React.FC<{
  data: TourDistribution[];
}> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Tour Categories</h2>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <span className="text-sm font-medium">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickActions: React.FC<{
  onCreateTour: () => void;
  onManageBookings: () => void;
  onViewAgents: () => void;
  onCustomerSupport: () => void;
}> = ({ onCreateTour, onManageBookings, onViewAgents, onCustomerSupport }) => {
  const actions = [
    { title: 'Create New Tour', icon: Plus, color: 'bg-blue-500', onClick: onCreateTour },
    { title: 'Manage Bookings', icon: Calendar, color: 'bg-green-500', onClick: onManageBookings },
    { title: 'View Agents', icon: BarChart3, color: 'bg-purple-500', onClick: onViewAgents },
    { title: 'Customer Support', icon: Users, color: 'bg-orange-500', onClick: onCustomerSupport },
  ];

  return (
    <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center space-x-3 w-full p-4 rounded-xl ${action.color} bg-opacity-10 hover:bg-opacity-20 transition-colors`}
          >
            <action.icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
            <span className="font-medium text-gray-900">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Simple content components for different views
const BookingsView: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Bookings Management</h2>
    <p className="text-gray-600">Here you can manage all your bookings, view details, and handle customer requests.</p>
  </div>
);

const ToursView: React.FC = () => {
  return <ToursManagement />;
};

const CustomersView: React.FC = () => {
  return <CustomerManagement />;
};

const AgentsView: React.FC = () => {
  return <AgentManagement />;
};

const SettingsView: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
    <p className="text-gray-600">Configure your application settings, preferences, and account details.</p>
  </div>
);


// Main Dashboard Component
const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('Dashboard');

  // Sample data
  const bookingData: BookingData[] = [
    { name: 'Mon', bookings: 12, revenue: 2400 },
    { name: 'Tue', bookings: 19, revenue: 1398 },
    { name: 'Wed', bookings: 8, revenue: 3200 },
    { name: 'Thu', bookings: 27, revenue: 2780 },
    { name: 'Fri', bookings: 35, revenue: 4890 },
    { name: 'Sat', bookings: 42, revenue: 6200 },
    { name: 'Sun', bookings: 38, revenue: 5800 }
  ];

  const tourDistribution: TourDistribution[] = [
    { name: 'Beach Tours', value: 35, color: '#3B82F6' },
    { name: 'Mountain Tours', value: 25, color: '#10B981' },
    { name: 'City Tours', value: 20, color: '#F59E0B' },
    { name: 'Adventure Tours', value: 15, color: '#EF4444' },
    { name: 'Cultural Tours', value: 5, color: '#8B5CF6' }
  ];

  const recentBookings: RecentBooking[] = [
    { id: 1, customer: 'John Doe', tour: 'Bali Beach Paradise', date: '2024-07-15', amount: 599, status: 'confirmed' },
    { id: 2, customer: 'Sarah Smith', tour: 'Tokyo City Adventure', date: '2024-07-16', amount: 899, status: 'pending' },
    { id: 3, customer: 'Mike Johnson', tour: 'Swiss Alps Trek', date: '2024-07-17', amount: 1299, status: 'confirmed' },
    { id: 4, customer: 'Emily Davis', tour: 'Rome Historical Tour', date: '2024-07-18', amount: 449, status: 'confirmed' },
    { id: 5, customer: 'David Wilson', tour: 'Safari Adventure', date: '2024-07-19', amount: 1599, status: 'pending' }
  ];

  const topTours: TopTour[] = [
    { name: 'Bali Beach Paradise', bookings: 156, revenue: 93600, rating: 4.8 },
    { name: 'Tokyo City Adventure', bookings: 134, revenue: 120460, rating: 4.9 },
    { name: 'Swiss Alps Trek', bookings: 89, revenue: 115611, rating: 4.7 },
    { name: 'Rome Historical Tour', bookings: 112, revenue: 50288, rating: 4.6 },
    { name: 'Safari Adventure', bookings: 78, revenue: 124722, rating: 4.9 }
  ];

  // Navigation handler
  const handleNavigation = (viewName: string) => {
    setCurrentView(viewName);
    console.log(`Navigating to ${viewName}`);
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };
  const handleFilter = () => console.log('Filter clicked');
  const handleViewAll = () => {
    setCurrentView('Bookings');
    console.log('View all bookings clicked');
  };
  const handleManageTours = () => {
    setCurrentView('Tours');
    console.log('Manage tours clicked');
  };
  const handleCreateTour = () => {
    setCurrentView('Tours');
    console.log('Create tour clicked');
  };
  const handleManageBookings = () => {
    setCurrentView('Bookings');
    console.log('Manage bookings clicked');
  };
  const handleViewAgents = () => {
    setCurrentView('Agents');
    console.log('View Agents clicked');
  };
  const handleCustomerSupport = () => {
    setCurrentView('Customers');
    console.log('Customer support clicked');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'Bookings':
        return <BookingsView />;
      case 'Tours':
        return <ToursView />;
      case 'Customers':
        return <CustomersView />;
      case 'Agents':
        return <AgentsView />;
      case 'Settings':
        return <SettingsView />;

      default:
        return (
          <>
            {/* Filters */}
            <DashboardFilters
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              onFilter={handleFilter}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Bookings"
                value="1,234"
                change={12.5}
                icon={Calendar}
                color="bg-blue-500"
              />
              <StatCard
                title="Total Revenue"
                value="₱89,432"
                change={8.2}
                icon={DollarSign}
                color="bg-green-500"
              />
              <StatCard
                title="Active Tours"
                value="42"
                change={-2.4}
                icon={MapPin}
                color="bg-purple-500"
              />
              <StatCard
                title="Total Customers"
                value="2,854"
                change={15.3}
                icon={Users}
                color="bg-orange-500"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <BookingChart data={bookingData} />
              <TourDistributionChart data={tourDistribution} />
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RecentBookings bookings={recentBookings} onViewAll={handleViewAll} />
              <TopTours tours={topTours} onManage={handleManageTours} />
            </div>

            {/* Quick Actions */}
            <QuickActions
              onCreateTour={handleCreateTour}
              onManageBookings={handleManageBookings}
              onViewAgents={handleViewAgents}
              onCustomerSupport={handleCustomerSupport}
            />
          </>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigation}
        activeItem={currentView}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentView}</h1>
                <p className="text-gray-600">
                  {currentView === 'Dashboard' 
                    ? "Welcome back! Here's your travel booking overview"
                    : `Manage your ${currentView.toLowerCase()} here`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="max-w-6l mx-auto pb-7">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;