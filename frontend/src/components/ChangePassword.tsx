'use client';

import { FormEvent, useEffect, useState } from 'react';
import apiClient from '@/lib/api';

interface ChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePassword({ isOpen, onClose }: ChangePasswordProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOldPassword('');
      setNewPassword('');
      setRepeatPassword('');
      setIsSubmitting(false);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timeout = setTimeout(() => {
      onClose();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [success, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== repeatPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.request('/api/backapi/changepassword', {
        method: 'PUT',
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.error_description ||
          errorData?.error ||
          'Unable to change password. Please try again.';
        setError(errorMessage);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Change password failed:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 max-h-[90vh] overflow-y-auto">
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
          <h2 className="text-2xl font-bold">Change password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium mb-2">
              Old password
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              required
              className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your old password"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your new password"
            />
            <p className="text-xs text-gray-600 mt-1">
              Use at least 8 characters with uppercase, lowercase, number, and special character.
            </p>
          </div>
          <div>
            <label htmlFor="repeatPassword" className="block text-sm font-medium mb-2">
              Repeat new password
            </label>
            <input
              id="repeatPassword"
              type="password"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              required
              className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Repeat your new password"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">Password updated successfully. Closing...</div>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
