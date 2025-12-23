'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string>('User');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await apiClient.getProfile();
        const name = `${profile.givenName} ${profile.familyName}`.trim();
        setFullName(name || 'User');
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Fallback to username if profile fetch fails
        setFullName(user?.username || 'User');
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">
          Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-gray-300 p-4">
            <h3 className="text-lg font-semibold mb-2">Welcome Back!</h3>
            <p>Hello, {fullName}!</p>
          </div>
          
          <div className="border border-gray-300 p-4">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <p>All systems operational</p>
          </div>
          
          <div className="border border-gray-300 p-4">
            <h3 className="text-lg font-semibold mb-2">Last Login</h3>
            <p>{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="border border-gray-300 p-4">
          <h3 className="text-lg font-semibold mb-2">
            Authentication Status
          </h3>
          <p>
            You are successfully authenticated and viewing a protected page.
          </p>
        </div>
      </div>
    </div>
  );
}
