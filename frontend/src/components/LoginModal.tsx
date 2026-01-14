'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onShowRegister?: () => void;
}

export default function LoginModal({ isOpen, onClose, initialEmail = '', onShowRegister }: LoginModalProps) {
  const router = useRouter();
  const { isAuthenticated, loading, login } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update email when initialEmail prop changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && isOpen) {
      onClose();
      // Redirect to home page on success
      router.push('/');
    }
  }, [isAuthenticated, loading, isOpen, onClose, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        username: email,
        password: password,
      });
      // Modal will close via the useEffect above when authenticated
    } catch (err) {
      // Check if it's a 4xx client error
      const errorWithData = err as Error & { status?: number; errorData?: any };
      const status = errorWithData?.status;
      if (status && status >= 400 && status < 500) {
        // Check for special case: EmailNotConfirmed
        if (errorWithData.errorData?.error === 'EmailNotConfirmed') {
          setError('Email must be confirmed before logging in');
        } else {
          // Show error message enumerating all possible 4xx reasons
          setError('Email does not exist, password is incorrect, or account is locked from too many failed password attempts');
        }
      } else {
        // For other errors (network errors, 5xx server errors, etc.), show a different message
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Login or sign up
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your password"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          {onShowRegister && (
            <div className="text-center text-sm">
              <span>Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShowRegister();
                }}
                className="text-blue-600 hover:underline"
              >
                Sign up
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
