import React, { useState, useEffect } from 'react';
import { LogOut, User, Globe, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import AuthComponent from '../../service/AuthComponent';
import Dashboard from '../../src/components/dashboard';



const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check authentication state on app load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowUserMenu(false);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Show auth component if user is not authenticated
  if (!user) {
    return <AuthComponent onAuthSuccess={handleAuthSuccess} />;
  }

  // Show dashboard with user menu if authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1">
        <Dashboard user={user} />
      </main>
    </div>
  );
};

export default App;