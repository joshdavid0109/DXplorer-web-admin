import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, MapPin, Users, Star, Eye, Edit3, Plus, Filter, BarChart3, TrendingUp, Settings, Menu, X, LogOutIcon, ChevronDown, Layers, Route, Hotel, FerrisWheel, Bed, Car } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import ToursManagement from './ToursManagement.tsx';
import { supabase } from '../../lib/supabase';
import CustomerManagement from './CustomerManagement.tsx';
import AgentManagement from './AgentManagement.tsx';
import BookingsManagement from './BookingsManagement.tsx';
import LandArrangementsManagement from './LandManagement.tsx';
import logo from '../assets/DX.png'
import AttractionsManagement from './AttractionsManagement.tsx';
import AccommodationsManagement from './AccommodationsManagement.tsx';
import CarRentalsManagement from './CarRentalsManagement.tsx';

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
  children?: NavigationItem[];
}


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (itemName: string) => void;
  activeItem: string;
}

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  activeTours: number;
  totalCustomers: number;
  bookingsChange: number;
  revenueChange: number;
  toursChange: number;
  customersChange: number;
}

type TimePeriod = '7d' | '30d' | '90d' | '1y';

// Custom hooks for data fetching
const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    activeTours: 0,
    totalCustomers: 0,
    bookingsChange: 0,
    revenueChange: 0,
    toursChange: 0,
    customersChange: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch total bookings
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });

        // Fetch total revenue from payments
        const { data: revenueData } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed'); // or whatever your completed status is

        const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        // Fetch active packages (tours)
        const { count: activeTours } = await supabase
          .from('packages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'); // adjust status value as needed

        // Fetch total users (customers) from user_profiles instead
        const { count: totalCustomers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // Calculate percentage changes (comparing with previous period)
        // For now, using mock changes - you can implement actual comparison logic
        setStats({
          totalBookings: totalBookings || 0,
          totalRevenue: totalRevenue,
          activeTours: activeTours || 0,
          totalCustomers: totalCustomers || 0,
          bookingsChange: 12.5,
          revenueChange: 8.2,
          toursChange: -2.4,
          customersChange: 15.3,
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};

const useBookingTrends = (period: TimePeriod) => {
  const [data, setData] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingTrends = async () => {
      try {
        setLoading(true);
        
        // Calculate date range based on period
        const now = new Date();
        const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

        const { data: bookings } = await supabase
          .from('bookings')
          .select('created_at, payments!inner(amount, status)')
          .gte('created_at', startDate.toISOString())
          .order('created_at');

        // Group data by day/week/month depending on period
        const groupedData = bookings?.reduce((acc, booking) => {
          const date = new Date(booking.created_at);
          const key = period === '7d' 
            ? date.toLocaleDateString('en-US', { weekday: 'short' })
            : period === '30d'
            ? `${date.getMonth() + 1}/${date.getDate()}`
            : `${date.getMonth() + 1}/${date.getFullYear()}`;

          if (!acc[key]) {
            acc[key] = { name: key, bookings: 0, revenue: 0 };
          }
          
          acc[key].bookings += 1;
          if (booking.payments && Array.isArray(booking.payments) && booking.payments.length > 0 && booking.payments[0].status === 'completed') {
            acc[key].revenue += booking.payments[0].amount || 0;
          }
          
          return acc;
        }, {} as Record<string, BookingData>) || {};

        setData(Object.values(groupedData));
      } catch (error) {
        console.error('Error fetching booking trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingTrends();
  }, [period]);

  return { data, loading };
};

const useRecentBookings = (limit: number = 5) => {
  const [bookings, setBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        const { data } = await supabase
          .from('bookings')
          .select(`
            booking_id,
            created_at,
            status,
            user_id,
            package_id
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

       const formattedBookings = await Promise.all(
  data?.map(async (booking) => {
    // Get user info
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', booking.user_id)
      .single();
    
    const { data: user } = await supabase
      .from('users')
      .select('username')
      .eq('user_id', booking.user_id)
      .single();
    
    // Get package info
    const { data: packageData } = await supabase
      .from('packages')
      .select('main_location')
      .eq('package_id', booking.package_id)
      .single();
    
    // Get payment info
    const { data: payment } = await supabase
      .from('payments')
      .select('amount')
      .eq('booking_id', booking.booking_id)
      .single();

    return {
      id: booking.booking_id,
      customer: userProfile 
        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
        : user?.username || 'Unknown Customer',
      tour: packageData?.main_location || 'Unknown Tour',
      date: new Date(booking.created_at).toLocaleDateString(),
      amount: payment?.amount || 0,
      status: booking.status as 'confirmed' | 'pending' | 'cancelled',
    };
  }) || []
);

        setBookings(formattedBookings);
      } catch (error) {
        console.error('Error fetching recent bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBookings();
  }, [limit]);

  return { bookings, loading };
};

const useTopTours = (limit: number = 5) => {
  const [tours, setTours] = useState<TopTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopTours = async () => {
      try {
        const { data } = await supabase
          .from('packages')
          .select(`
            package_id,
            main_location,
            price,
            bookings!inner(booking_id, status),
            ratings(rating)
          `);

        const toursWithStats = data?.map(tour => {
          const confirmedBookings = tour.bookings.filter(b => b.status === 'confirmed');
          const totalRevenue = confirmedBookings.length * (tour.price || 0);
          const avgRating = tour.ratings?.reduce((sum, r) => sum + r.rating, 0) / (tour.ratings?.length || 1) || 0;
          
          return {
            name: tour.main_location,
            bookings: confirmedBookings.length,
            revenue: totalRevenue,
            rating: avgRating,
          };
        }) || [];

        // Sort by bookings count and take top tours
        const topTours = toursWithStats
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, limit);

        setTours(topTours);
      } catch (error) {
        console.error('Error fetching top tours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopTours();
  }, [limit]);

  return { tours, loading };
};

const useTourDistribution = () => {
  const [data, setData] = useState<TourDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTourDistribution = async () => {
      try {
        const { data: packages } = await supabase
          .from('packages')
          .select(`
            tour_type,
            bookings!inner(booking_id)
          `);

        const categoryCount = packages?.reduce((acc, pkg) => {
          const category = pkg.tour_type || 'Other';
          acc[category] = (acc[category] || 0) + pkg.bookings.length;
          return acc;
        }, {} as Record<string, number>) || {};

        const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
        
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        
        const distribution = Object.entries(categoryCount).map(([name, count], index) => ({
          name,
          value: Math.round((count / total) * 100),
          color: colors[index % colors.length],
        }));

        setData(distribution);
      } catch (error) {
        console.error('Error fetching tour distribution:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTourDistribution();
  }, []);

  return { data, loading };
};

// Enhanced Sidebar Component with Navigation (unchanged)
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, activeItem }) => {
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Services: true,
  });


  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', icon: BarChart3 },
    { name: 'Bookings', icon: Calendar },

    {
      name: 'Services',
      icon: Layers,
      children: [
        { name: 'Tours', icon: Route },
        { name: 'Land', icon: Hotel },
        { name: 'Attractions', icon: FerrisWheel },
        { name: 'Accommodations', icon: Bed },
        { name: 'Car Rentals', icon: Car },
      ],
    },

    { name: 'Customers', icon: Users },
    { name: 'Agents', icon: TrendingUp },
    { name: 'Settings', icon: Settings },
    { name: 'Log out', icon: LogOutIcon },
  ];


  const handleNavigation = (itemOrName: NavigationItem | string) => {
    const name = typeof itemOrName === 'string' ? itemOrName : itemOrName.name;

    if (window.innerWidth < 1024) {
      onClose();
    }

    if (name === 'Log out') {
      supabase.auth.signOut().then(() => {
        window.location.href = '/';
      }).catch((error) => {
        console.error('Logout failed:', error);
      });
      return;
    }

    onNavigate(name);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="p-2 rounded-lg"> 
              <img 
                src={logo}
                alt="DXplorer" 
                className="w-full h-auto object-contain max-w-21 max-h-17"
              />
            </div>
          </div>
          
          <nav className="space-y-1">
  {navigationItems.map((item) => {
    // GROUP (Services)
    if (item.children) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleGroup(item.name)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                openGroups[item.name] ? "rotate-180" : ""
              }`}
            />
          </button>

          {openGroups[item.name] && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child) => (
                <button
                  key={child.name}
                  onClick={() => handleNavigation(child.name)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                    activeItem === child.name
                      ? "bg-[#154689] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <child.icon className="h-4 w-4" />
                  {child.name}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // NORMAL ITEM
    return (
      <button
        key={item.name}
        onClick={() => handleNavigation(item.name)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
          activeItem === item.name
            ? "bg-[#154689] text-white"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </button>
    );
  })}
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
  loading: boolean;
  onViewAll: () => void;
}> = ({ bookings, loading, onViewAll }) => {
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent bookings found</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{booking.customer}</h3>
                <p className="text-sm text-gray-600">{booking.tour}</p>
                <p className="text-xs text-gray-500">{booking.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₱{booking.amount.toLocaleString()}</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const TopTours: React.FC<{
  tours: TopTour[];
  loading: boolean;
  onManage: () => void;
}> = ({ tours, loading, onManage }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        {tours.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tour data available</p>
        ) : (
          tours.map((tour, index) => (
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
          ))
        )}
      </div>
    </div>
  );
};

const BookingChart: React.FC<{
  data: BookingData[];
  loading: boolean;
}> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

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
  loading: boolean;
}> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

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
const BookingsView: React.FC = () => {
  return <BookingsManagement />;
};

const ToursView: React.FC = () => {
  return <ToursManagement />;
};

const LandArrangementsView: React.FC = () => {
  return <LandArrangementsManagement />;
};

const AttractionsView: React.FC = () => {
  return <AttractionsManagement />;
};

const AccommodationsView: React.FC = () => {
  return <AccommodationsManagement />;
}

const CarRentalsView: React.FC = () => {
  return <CarRentalsManagement />;
}


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


// Main Dashboard Component with Supabase Integration
const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('Dashboard');

  // Use custom hooks for data fetching
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { data: bookingData, loading: chartLoading } = useBookingTrends(selectedPeriod);
  const { bookings: recentBookings, loading: bookingsLoading } = useRecentBookings(5);
  const { tours: topTours, loading: toursLoading } = useTopTours(5);
  const { data: tourDistribution, loading: distributionLoading } = useTourDistribution();

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
      case 'Land':
        return <LandArrangementsView />;       
      case 'Attractions':
        return <AttractionsView />; 
      case 'Accommodations':
        return <AccommodationsView />; 
      case 'Car Rentals':
        return <CarRentalsView />;
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

            {/* Error Display */}
            {statsError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">Error loading dashboard data: {statsError}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsLoading ? (
                // Loading skeletons
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings.toLocaleString()}
                    change={stats.bookingsChange}
                    icon={Calendar}
                    color="bg-blue-500"
                  />
                  <StatCard
                    title="Total Revenue"
                    value={`₱${stats.totalRevenue.toLocaleString()}`}
                    change={stats.revenueChange}
                    icon={DollarSign}
                    color="bg-green-500"
                  />
                  <StatCard
                    title="Active Tours"
                    value={stats.activeTours.toString()}
                    change={stats.toursChange}
                    icon={MapPin}
                    color="bg-purple-500"
                  />
                  <StatCard
                    title="Total Customers"
                    value={stats.totalCustomers.toLocaleString()}
                    change={stats.customersChange}
                    icon={Users}
                    color="bg-orange-500"
                  />
                </>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <BookingChart data={bookingData} loading={chartLoading} />
              <TourDistributionChart data={tourDistribution} loading={distributionLoading} />
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RecentBookings 
                bookings={recentBookings} 
                loading={bookingsLoading}
                onViewAll={handleViewAll} 
              />
              <TopTours 
                tours={topTours} 
                loading={toursLoading}
                onManage={handleManageTours} 
              />
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
          <div className="max-w-6xl mx-auto pb-7">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;