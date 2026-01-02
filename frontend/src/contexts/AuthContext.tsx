'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '@/lib/auth';
import apiClient from '@/lib/api';

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  federatedLogin: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          setIsAuthenticated(true);
          setUser(AuthService.getUser());
          setLoading(false);
        } else {
          // localStorage is empty - attempt to recover session from cookie
          // This will silently fail with 401 if no refresh token cookie exists
          // which is expected behavior for users who haven't logged in
          const recovered = await AuthService.attemptSessionRecovery();
          if (recovered) {
            setIsAuthenticated(true);
            setUser(AuthService.getUser());
          } else {
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
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const data = await apiClient.login(credentials);
    setIsAuthenticated(true);
    setUser(data.user);
  };

  const federatedLogin = async () => {
    const data = await apiClient.federatedLogin();
    setIsAuthenticated(true);
    setUser(data.user);
  };

  const logout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, federatedLogin, logout, loading }}>
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
