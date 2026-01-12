'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function FederatedLoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading, federatedLogin } = useAuth();
  const hasAttemptedLogin = useRef(false);
  const hasRedirected = useRef(false);

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  // Perform federated login when not authenticated
  useEffect(() => {
    const performFederatedLogin = async () => {
      // Don't attempt if already authenticated, loading, or already attempted
      if (loading || isAuthenticated || hasAttemptedLogin.current || hasRedirected.current) {
        return;
      }

      hasAttemptedLogin.current = true;
      
      try {
        await federatedLogin();
        // After successful login, the isAuthenticated state will update
        // and the redirect effect above will handle navigation
      } catch (err) {
        console.error('Federated login failed:', err);
        // On any error (including 401), redirect to home page
        // This page has no user interaction, so errors should redirect
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.push('/');
        }
      }
    };

    performFederatedLogin();
  }, [loading, isAuthenticated, federatedLogin, router]);

  // Show loading state while checking authentication or during login
  // Don't show anything if we've redirected
  if (hasRedirected.current) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

