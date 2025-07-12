// components/dashboard/tables/TopTours/TopTours.tsx
import React from 'react';
import { Star, Eye, Edit3 } from 'lucide-react';
import { TopTour } from '../../../../../src/types/dashboard';

interface TopToursProps {
  tours: TopTour[];
  onManageTours: () => void;
  onViewTour: (tourName: string) => void;
  onEditTour: (tourName: string) => void;
}

const TopTours: React.FC<TopToursProps> = ({ tours, onManageTours, onViewTour, onEditTour }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Top Performing Tours</h2>
        <button 
          onClick={onManageTours}
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
              <p className="font-semibold text-gray-900">${tour.revenue.toLocaleString()}</p>
              <div className="flex items-center space-x-2 mt-1">
                <button 
                  onClick={() => onViewTour(tour.name)}
                  className="p-1 text-gray-400 hover:text-blue-500"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onEditTour(tour.name)}
                  className="p-1 text-gray-400 hover:text-green-500"
                >
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

export default TopTours;