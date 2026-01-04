'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user, logout, loading, fetchProfile } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      router.push('/login');
    }
  };

  const toggleDock = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Fetch profile when component loads and user is authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && !user) {
      fetchProfile();
    }
  }, [loading, isAuthenticated, user, fetchProfile]);

  useEffect(() => {
    if (loading || !isAuthenticated) {
      // Set sidebar width to 0 when not authenticated
      document.documentElement.style.setProperty('--sidebar-width', '0');
    } else {
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '4rem' : '16rem');
    }
  }, [isCollapsed, isAuthenticated, loading]);

  // Don't display sidebar if user is not authenticated
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <nav className={`border-r h-screen fixed left-0 top-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <Link href="/" className="text-xl font-bold">
              Architecture AI
            </Link>
          )}
          <button
            onClick={toggleDock}
            className="border border-gray-400 px-2 py-1 hover:bg-gray-100"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <div className="flex-1 flex flex-col p-4 gap-4">
          <Link
            href="/"
            className="hover:underline"
          >
            {isCollapsed ? 'H' : 'Home'}
          </Link>
          
          {isAuthenticated ? (
            <>
              {!isCollapsed && (
                <div className="mt-auto space-y-4">
                  <div className="text-sm border-t pt-4">
                    {user?.name || 'User'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full border border-gray-400 px-4 py-1 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
              {isCollapsed && (
                <div className="mt-auto">
                  <button
                    onClick={handleLogout}
                    className="border border-gray-400 px-2 py-1 hover:bg-gray-100"
                    title="Logout"
                  >
                    L
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className={`border border-black ${isCollapsed ? 'px-2' : 'px-4'} py-1 hover:bg-black hover:text-white`}
            >
              {isCollapsed ? 'L' : 'Login'}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
