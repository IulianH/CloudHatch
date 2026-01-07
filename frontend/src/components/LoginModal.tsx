'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import { buildApiUrl, isRelativeUrl } from '@/lib/url-utils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { isAuthenticated, loading } = useAuth();

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, loading, isOpen, onClose]);

  const handleGoogleLogin = () => {
    // Build the Google OAuth URL
    const googleOAuthUrl = isRelativeUrl(API_CONFIG.GOOGLE_OAUTH_URL)
      ? buildApiUrl(API_CONFIG.GOOGLE_OAUTH_URL)
      : API_CONFIG.GOOGLE_OAUTH_URL;
    
    // Redirect to Google OAuth endpoint
    window.location.href = googleOAuthUrl;
  };

  const handleMicrosoftLogin = () => {
    // Build the Microsoft OAuth URL
    const microsoftOAuthUrl = isRelativeUrl(API_CONFIG.MICROSOFT_OAUTH_URL)
      ? buildApiUrl(API_CONFIG.MICROSOFT_OAUTH_URL)
      : API_CONFIG.MICROSOFT_OAUTH_URL;
    
    // Redirect to Microsoft OAuth endpoint
    window.location.href = microsoftOAuthUrl;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Login or sign up
          </h2>
        </div>
        
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            Continue with Google
          </button>
          
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            className="w-full border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23">
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
            Continue with Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}

