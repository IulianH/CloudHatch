'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import AuthService, { RecoveryResult } from '@/lib/auth';
import apiClient from '@/lib/api';

interface User {
  name: string;
  idp: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  federatedLogin: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  sessionExpired: boolean;
  showSessionExpired: () => void;
  networkError: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const fetchingProfileRef = useRef(false);
  const pathname = usePathname();
  const authCheckAbortControllerRef = useRef<AbortController | null>(null);

  // Show the session-expired modal when an API request fails with 401
  // and the session cannot be recovered by a token refresh
  useEffect(() => {
    apiClient.setSessionExpiredCallback(() => setSessionExpired(true));
    return () => apiClient.setSessionExpiredCallback(null);
  }, []);

  // Show the matching modal when a proactive (timer-driven) token refresh
  // fails with a definitive outcome: 4xx rejection -> session expired,
  // network error (no response) -> connectivity error
  useEffect(() => {
    AuthService.setRefreshFailureCallback((result: RecoveryResult) => {
      if (result.rejected) {
        setIsAuthenticated(false);
        setUser(null);
        setSessionExpired(true);
      } else if (result.networkError) {
        setNetworkError(true);
      }
    });
    return () => AuthService.setRefreshFailureCallback(null);
  }, []);

  // Dismiss the blocking modals once the user reaches the login page
  useEffect(() => {
    if (pathname === '/login') {
      setSessionExpired(false);
      setNetworkError(false);
    }
  }, [pathname]);

  // Check authentication status on mount
  useEffect(() => {
    // Abort any previous auth check
    if (authCheckAbortControllerRef.current) {
      authCheckAbortControllerRef.current.abort();
    }

    // Create new abort controller for this check
    const abortController = new AbortController();
    authCheckAbortControllerRef.current = abortController;

    // Set a timeout to ensure loading is always set to false
    // This prevents the page from being stuck on "Loading..." if the auth check hangs
    const timeoutId = setTimeout(() => {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    const checkAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          if (!abortController.signal.aborted) {
            setIsAuthenticated(true);
            setLoading(false);
          }
        } else {
          // Attempt session recovery from cookie on all pages except /federatedLogin
          // Skip recovery for /federatedLogin since that's where OAuth callback happens
          if (pathname !== '/federatedLogin') {
            // localStorage is empty - attempt to recover session from cookie
            // This will silently fail with 401 if no refresh token cookie exists
            // which is expected behavior for users who haven't logged in
            const { recovered, rejected, networkError: hadNetworkError } = await AuthService.attemptSessionRecovery();
            if (!abortController.signal.aborted) {
              if (recovered) {
                setIsAuthenticated(true);
              } else {
                setIsAuthenticated(false);
                setUser(null);
                if (rejected) {
                  // The refresh endpoint definitively rejected a session that
                  // previously existed (flag was set) - show the expired modal
                  setSessionExpired(true);
                } else if (hadNetworkError) {
                  // The server could not be reached (no response/status code)
                  // - show the network error modal
                  setNetworkError(true);
                }
              }
              setLoading(false);
            }
          } else {
            // On /federatedLogin, skip recovery as OAuth flow will handle authentication
            if (!abortController.signal.aborted) {
              setIsAuthenticated(false);
              setUser(null);
              setLoading(false);
            }
          }
        }
      } catch (error) {
        // Only log unexpected errors (network failures, etc.)
        // 401 errors from refresh attempts are expected and handled silently
        if (!abortController.signal.aborted) {
          if (error instanceof Error && !error.message.includes('401')) {
            console.error('Auth check failed:', error);
          }
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  const fetchProfile = async () => {
    // Prevent duplicate calls
    if (fetchingProfileRef.current) {
      return;
    }
    
    fetchingProfileRef.current = true;
    try {
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setUser(null);
    } finally {
      fetchingProfileRef.current = false;
    }
  };

  const federatedLogin = async () => {
    await apiClient.federatedLogin();
    setIsAuthenticated(true);
    await fetchProfile();
  };

  const showSessionExpired = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSessionExpired(true);
  };

  const logout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, federatedLogin, logout, loading, fetchProfile, sessionExpired, showSessionExpired, networkError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
