// components/dashboard/tables/RecentBookings/RecentBookings.tsx
import React from 'react';
import { RecentBooking } from '../../../../../src/types/dashboard';

interface RecentBookingsProps {
  bookings: RecentBooking[];
  onViewAll: () => void;
}

const RecentBookings: React.FC<RecentBookingsProps> = ({ bookings, onViewAll }) => {
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
              <p className="font-semibold text-gray-900">${booking.amount}</p>
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

export default RecentBookings;