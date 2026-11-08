'use client';

export default function NetworkErrorModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Network error</h1>
        <p className="mb-6">The server is unreachable. Please check your connection and refresh the page.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Refresh page
        </button>
      </div>
    </div>
  );
}
