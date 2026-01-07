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
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      router.push('/');
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
                  <div className="text-sm border-t pt-4 flex items-center gap-2">
                    {user?.idp === 'google' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {user?.idp === 'microsoft' && (
                      <svg className="w-4 h-4" viewBox="0 0 23 23">
                        <path
                          fill="#f25022"
                          d="M0 0h10.5v10.5H0z"
                        />
                        <path
                          fill="#00a4ef"
                          d="M12.5 0H23v10.5H12.5z"
                        />
                        <path
                          fill="#7fba00"
                          d="M0 12.5h10.5V23H0z"
                        />
                        <path
                          fill="#ffb900"
                          d="M12.5 12.5H23V23H12.5z"
                        />
                      </svg>
                    )}
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
