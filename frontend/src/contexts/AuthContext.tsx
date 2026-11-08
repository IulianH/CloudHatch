'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AuthService from '@/lib/auth';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingProfileRef = useRef(false);

  // Check authentication status on mount
  useEffect(() => {
    // Set a timeout to ensure loading is always set to false
    // This prevents the page from being stuck on "Loading..." if the auth check hangs
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 second timeout

    const checkAuth = () => {
      if (AuthService.isAuthenticated()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

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
  };

  const logout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, federatedLogin, logout, loading, fetchProfile }}>
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
