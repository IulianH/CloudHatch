'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import RegisterCompletedModal from '@/components/RegisterCompletedModal';
import ResendRegistrationEmailModal from '@/components/ResendRegistrationEmailModal';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onShowLogin?: () => void;
}

export default function RegisterModal({ isOpen, onClose, initialEmail = '', onShowLogin }: RegisterModalProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [completedEmail, setCompletedEmail] = useState<string | null>(null);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

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
      router.push('/');
    }
  }, [isAuthenticated, loading, isOpen, onClose, router]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side email validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.register({
        email: email.trim(),
        password: password,
      });
      setSuccess(true);
      setCompletedEmail(email.trim());
      setShowCompletedModal(true);
    } catch (err) {
      const errorWithData = err as Error & { status?: number; errorData?: any };
      const status = errorWithData?.status;
      if (status && status >= 400 && status < 500) {
        const errorMessage = errorWithData.errorData?.error_description || 
                           errorWithData.errorData?.error || 
                           'Registration failed. Please check your information and try again.';
        setError(errorMessage);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleCompletedClose = () => {
    if (success) {
      onClose();
      return;
    }
    setShowCompletedModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 max-h-[90vh] overflow-y-auto">
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
            Create an account
          </h2>
        </div>
        
        {!success && (
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
              <p className="text-xs text-gray-600 mt-1">
                Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Repeat password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Repeat your password"
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
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
            <div className="text-center text-sm">
              <span>Already registered? </span>
              <button
                type="button"
                onClick={() => setShowResendModal(true)}
                className="text-blue-600 hover:underline"
              >
                Resend link
              </button>
            </div>
          </form>
        )}
      </div>
      <RegisterCompletedModal
        isOpen={success || showCompletedModal}
        email={completedEmail ?? email}
        onClose={handleCompletedClose}
      />
      <ResendRegistrationEmailModal
        isOpen={showResendModal}
        initialEmail={email}
        onClose={() => setShowResendModal(false)}
      />
    </div>
  );
}
