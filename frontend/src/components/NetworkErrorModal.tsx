'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function NetworkErrorModal() {
  const { networkError } = useAuth();

  useEffect(() => {
    if (networkError) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [networkError]);

  if (!networkError) {
    return null;
  }

  const handleTryAgain = () => {
    window.location.assign('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-8"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="network-error-title"
        aria-describedby="network-error-description"
      >
        <h2 id="network-error-title" className="text-2xl font-bold mb-4">
          Network Error
        </h2>
        <p id="network-error-description" className="text-gray-700 mb-6">
          We couldn&apos;t reach the server. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={handleTryAgain}
          className="w-full border border-black bg-black text-white px-4 py-2 hover:bg-white hover:text-black transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
