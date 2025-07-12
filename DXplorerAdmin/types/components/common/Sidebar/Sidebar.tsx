// components/common/Sidebar/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { Globe, BarChart3, Calendar, MapPin, Users, TrendingUp, Settings } from 'lucide-react';
import { NavigationItem } from '../../../../src/types/dashboard';

// Uncomment and adjust based on your routing solution:
// import { useNavigate, useLocation } from 'react-router-dom'; // For React Router
// import { useRouter } from 'next/router'; // For Next.js

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (itemName: string, href: string) => void;
  currentPath?: string; // Optional: pass current path from parent
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate,
  currentPath 
}) => {
  const [activeItem, setActiveItem] = useState<string>('Dashboard');
  
  // Uncomment based on your routing solution:
  // const navigate = useNavigate(); // React Router
  // const location = useLocation(); // React Router
  // const router = useRouter(); // Next.js

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    { name: 'Bookings', icon: Calendar, href: '/bookings' },
    { name: 'Tours', icon: MapPin, href: '/tours' },
    { name: 'Customers', icon: Users, href: '/customers' },
    { name: 'Analytics', icon: TrendingUp, href: '/analytics' },
    { name: 'Settings', icon: Settings, href: '/settings' }
  ];

  // Update active item based on current path
  useEffect(() => {
    const path = currentPath || window.location.pathname;
    const currentItem = navigationItems.find(item => item.href === path);
    if (currentItem) {
      setActiveItem(currentItem.name);
    }
  }, [currentPath]);

  const handleNavigation = (item: NavigationItem) => {
    setActiveItem(item.name);
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
    
    // Call parent callback if provided
    if (onNavigate && item.href) {
      onNavigate(item.name, item.href);
    }
    
    // Handle navigation based on your routing solution:
    
    // Option 1: React Router
    // if (item.href) {
    //   navigate(item.href);
    // }
    
    // Option 2: Next.js Router
    // if (item.href) {
    //   router.push(item.href);
    // }
    
    // Option 3: Custom routing function
    // if (item.href) {
    //   window.history.pushState({}, '', item.href);
    //   // Trigger a custom event or state update for your app
    //   window.dispatchEvent(new CustomEvent('navigation', { detail: { path: item.href } }));
    // }
    
    // Option 4: Simple page navigation (fallback)
    if (item.href && item.href !== '#') {
      window.location.href = item.href;
    }
  };

  const isItemActive = (item: NavigationItem) => {
    // Check if item is active based on current path or active state
    const path = currentPath || window.location.pathname;
    return item.href === path || activeItem === item.name;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DXplorer</h1>
              <p className="text-sm text-gray-500">Travel & Tours</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isItemActive(item)
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                aria-current={isItemActive(item) ? 'page' : undefined}
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

export default Sidebar;