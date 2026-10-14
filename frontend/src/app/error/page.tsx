'use client';

import { useRouter } from 'next/navigation';

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong, try logging in again</h1>
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Back to log in
        </button>
      </div>
    </div>
  );
}
