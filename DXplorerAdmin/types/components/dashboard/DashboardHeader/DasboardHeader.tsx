// components/dashboard/DashboardHeader/DashboardHeader.tsx
import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  notificationCount?: number;
  userInitial?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onToggleSidebar, 
  notificationCount = 0, 
  userInitial = 'A' 
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back! Here's your travel booking overview</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <Bell className="h-6 w-6 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">{userInitial}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;