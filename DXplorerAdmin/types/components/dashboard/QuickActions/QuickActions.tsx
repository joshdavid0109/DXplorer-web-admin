// components/dashboard/QuickActions/QuickActions.tsx
import React from 'react';
import { Plus, Calendar, BarChart3, Users } from 'lucide-react';
import { QuickActionProps } from '../../../../src/types/dashboard';

const QuickAction: React.FC<QuickActionProps> = ({ title, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-4 rounded-xl ${color} bg-opacity-10 hover:bg-opacity-20 transition-colors`}
  >
    <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
    <span className="font-medium text-gray-900">{title}</span>
  </button>
);

interface QuickActionsProps {
  onCreateTour: () => void;
  onManageBookings: () => void;
  onViewAnalytics: () => void;
  onCustomerSupport: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateTour,
  onManageBookings,
  onViewAnalytics,
  onCustomerSupport
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          title="Create New Tour"
          icon={Plus}
          color="bg-blue-500"
          onClick={onCreateTour}
        />
        <QuickAction
          title="Manage Bookings"
          icon={Calendar}
          color="bg-green-500"
          onClick={onManageBookings}
        />
        <QuickAction
          title="View Analytics"
          icon={BarChart3}
          color="bg-purple-500"
          onClick={onViewAnalytics}
        />
        <QuickAction
          title="Customer Support"
          icon={Users}
          color="bg-orange-500"
          onClick={onCustomerSupport}
        />
      </div>
    </div>
  );
};

export default QuickActions;