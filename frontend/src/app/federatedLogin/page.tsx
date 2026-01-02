'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function FederatedLoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading, federatedLogin } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAttemptedLogin = useRef(false);

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  // Perform federated login when not authenticated
  useEffect(() => {
    const performFederatedLogin = async () => {
      if (!loading && !isAuthenticated && !isLoggingIn && !hasAttemptedLogin.current) {
        hasAttemptedLogin.current = true;
        setIsLoggingIn(true);
        setError(null);
        try {
          await federatedLogin();
          // After successful login, the isAuthenticated state will update
          // and the redirect effect above will handle navigation
        } catch (err) {
          console.error('Federated login failed:', err);
          setError(err instanceof Error ? err.message : 'Federated login failed');
          setIsLoggingIn(false);
          hasAttemptedLogin.current = false; // Allow retry
        }
      }
    };

    performFederatedLogin();
  }, [loading, isAuthenticated, isLoggingIn, federatedLogin]);

  // Show loading state while checking authentication or during login
  if (loading || isLoggingIn || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if login failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoggingIn(false);
              window.location.reload();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return null;
}

