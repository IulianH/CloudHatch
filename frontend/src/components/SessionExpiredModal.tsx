'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionExpiredModal() {
  const { sessionExpired } = useAuth();
  const router = useRouter();
  const handleLoginAgain = () => {
    router.push('/login');
  };

  useEffect(() => {
    if (sessionExpired) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sessionExpired]);

  if (!sessionExpired) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-8"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-description"
      >
        <h2 id="session-expired-title" className="text-2xl font-bold mb-4">
          Session Expired
        </h2>
        <p id="session-expired-description" className="text-gray-700 mb-6">
          Your session has expired. Please log in again to continue.
        </p>
        <button
          type="button"
          onClick={handleLoginAgain}
          className="w-full border border-black bg-black text-white px-4 py-2 hover:bg-white hover:text-black transition-colors"
        >
          Login again
        </button>
      </div>
    </div>
  );
}
