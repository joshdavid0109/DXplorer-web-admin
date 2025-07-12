// components/dashboard/DashboardFilters/DashboardFilters.tsx
import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { TimePeriod } from '../../../../src/types/dashboard';

interface DashboardFiltersProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  onAddTour: () => void;
  onFilter: () => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  selectedPeriod,
  onPeriodChange,
  onAddTour,
  onFilter
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
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
          <button 
            onClick={onAddTour}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Tour</span>
          </button>
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

export default DashboardFilters;