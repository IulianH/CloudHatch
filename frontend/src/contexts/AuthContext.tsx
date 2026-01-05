'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import AuthService from '@/lib/auth';
import apiClient from '@/lib/api';

interface User {
  name: string;
  roles: string;
  givenName: string;
  familyName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  federatedLogin: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingProfileRef = useRef(false);
  const pathname = usePathname();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          // Only attempt session recovery on the main page and if user is not authenticated
          // Skip recovery for /federatedLogin and other pages
          if (pathname === '/') {
            // localStorage is empty - attempt to recover session from cookie
            // This will silently fail with 401 if no refresh token cookie exists
            // which is expected behavior for users who haven't logged in
            const recovered = await AuthService.attemptSessionRecovery();
            if (recovered) {
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
              setUser(null);
            }
          } else {
            // On other pages, just set authenticated to false without attempting recovery
            setIsAuthenticated(false);
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        // Only log unexpected errors (network failures, etc.)
        // 401 errors from refresh attempts are expected and handled silently
        if (error instanceof Error && !error.message.includes('401')) {
          console.error('Auth check failed:', error);
        }
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
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

  const login = async (credentials: { username: string; password: string }) => {
    await apiClient.login(credentials);
    setIsAuthenticated(true);
    await fetchProfile();
  };

  const federatedLogin = async () => {
    await apiClient.federatedLogin();
    setIsAuthenticated(true);
    await fetchProfile();
  };

  const logout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, federatedLogin, logout, loading, fetchProfile }}>
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
