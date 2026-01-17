'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import Link from 'next/link';

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid url');
      return;
    }

    const confirmEmail = async () => {
      try {
        await apiClient.confirmEmail(token);
        // 2xx response - success
        setStatus('success');
        setMessage('Your email has been confirmed successfully!');
      } catch (err) {
        const errorWithData = err as Error & { status?: number; errorData?: any };
        const statusCode = errorWithData?.status;
        
        // Check if it's a 4xx client error
        if (statusCode && statusCode >= 400 && statusCode < 500) {
          const errorData = errorWithData.errorData || {};
          const errorType = errorData.Error || errorData.error; // Check both capital and lowercase
          
          if (errorType === 'AlreadyConfirmed') {
            setStatus('error');
            setMessage('This email is already confirmed.');
          } else if (errorType === 'TokenExpired') {
            setStatus('error');
            setMessage('This email confirmation link has expired.');
          } else {
            // Any other 4xx error
            setStatus('error');
            setMessage('Invalid url');
          }
        } else {
          // For other errors (network errors, 5xx server errors, etc.)
          setStatus('error');
          setMessage('An error occurred. Please try again.');
        }
      }
    };

    confirmEmail();
  }, [searchParams]);

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
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <div className="text-red-600 text-lg font-semibold">
              ✗ Confirmation Failed
            </div>
            <p className="text-gray-700">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
