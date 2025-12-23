'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

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

  return (
    <nav className="border-b">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div>
            <Link href="/" className="text-xl font-bold">
              CloudHatch
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hover:underline"
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="hover:underline"
                >
                  Dashboard
                </Link>
                <span className="text-sm">
                  {user?.username || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="border border-gray-400 px-4 py-1 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="border border-black px-4 py-1 hover:bg-black hover:text-white"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
