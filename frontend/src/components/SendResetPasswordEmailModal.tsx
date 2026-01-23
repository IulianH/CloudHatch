'use client';

import { FormEvent, useEffect, useState } from 'react';
import apiClient from '@/lib/api';

interface SendResetPasswordEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export default function SendResetPasswordEmailModal({
  isOpen,
  onClose,
  initialEmail = '',
}: SendResetPasswordEmailModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setEmail(initialEmail);
    setError(null);
    setSuccess(false);
  }, [isOpen, initialEmail]);

  if (!isOpen) {
    return null;
  }

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.sendResetPasswordEmail({ email: trimmedEmail });
      setSuccess(true);
    } catch (err) {
      const errorWithData = err as Error & { status?: number; errorData?: any };
      const errorMessage =
        errorWithData.errorData?.error_description ||
        errorWithData.errorData?.error ||
        errorWithData.message ||
        'Failed to send reset password email.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

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

        <div className="space-y-6 text-center">
          <div className="text-2xl font-bold">
            Reset Password
          </div>

          {success ? (
            <div className="space-y-3">
              <p className="text-gray-700">
                If an account exists for {email.trim()}, a reset link has been sent.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-left">
                <label htmlFor="reset-email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter your email"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm text-left">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
