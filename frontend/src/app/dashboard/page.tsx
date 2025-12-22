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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Welcome Back!</h3>
              <p className="text-blue-700">Hello, {fullName}!</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Status</h3>
              <p className="text-green-700">All systems operational</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900">Last Login</h3>
              <p className="text-purple-700">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Status
            </h3>
            <p className="text-gray-700">
              You are successfully authenticated and viewing a protected page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
