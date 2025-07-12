// types/dashboard.ts
export interface BookingData {
  name: string;
  bookings: number;
  revenue: number;
}

export interface TourDistribution {
  name: string;
  value: number;
  color: string;
}

export interface RecentBooking {
  id: number;
  customer: string;
  tour: string;
  date: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface TopTour {
  name: string;
  bookings: number;
  revenue: number;
  rating: number;
}

export interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface QuickActionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

export interface NavigationItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  href?: string;
}

export type TimePeriod = '7d' | '30d' | '90d' | '1y';