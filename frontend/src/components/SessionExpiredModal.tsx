'use client';

import { useRouter } from 'next/navigation';

export default function SessionExpiredModal() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Session expired</h1>
        <p className="mb-6">Your session has expired. Please log in again.</p>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Back to log in
        </button>
      </div>
    </div>
  );
}
