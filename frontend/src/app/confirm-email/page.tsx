'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import Link from 'next/link';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No confirmation token provided.');
      return;
    }

    const confirmEmail = async () => {
      try {
        const result = await apiClient.confirmEmail(token);
        setStatus('success');
        setMessage(result.message || 'Email confirmed successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err) {
        const errorWithData = err as Error & { status?: number; errorData?: any };
        const errorMessage = errorWithData.errorData?.error_description || 
                           errorWithData.errorData?.error || 
                           'Failed to confirm email. The token may be invalid or expired.';
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <div>
            <p className="text-lg">Confirming your email...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-4">
            <div className="text-green-600 text-lg font-semibold">
              ✓ Email Confirmed
            </div>
            <p className="text-gray-700">{message}</p>
            <p className="text-sm text-gray-600">Redirecting to login page...</p>
            <Link
              href="/login"
              className="inline-block border border-black px-6 py-2 hover:bg-black hover:text-white transition-colors"
            >
              Go to login page
            </Link>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <div className="text-red-600 text-lg font-semibold">
              ✗ Confirmation Failed
            </div>
            <p className="text-gray-700">{message}</p>
            <div className="space-y-2">
              <Link
                href="/register"
                className="inline-block border border-black px-6 py-2 hover:bg-black hover:text-white transition-colors mr-2"
              >
                Register again
              </Link>
              <Link
                href="/login"
                className="inline-block border border-gray-400 px-6 py-2 hover:bg-gray-100 transition-colors"
              >
                Go to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
