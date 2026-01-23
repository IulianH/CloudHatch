'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';

export default function ResetPasswordPage() {
   const searchParams = useSearchParams();
   const [token, setToken] = useState<string | null>(null);
   const [password, setPassword] = useState('');
   const [repeatPassword, setRepeatPassword] = useState('');
   const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
   const [message, setMessage] = useState('');
 
   useEffect(() => {
     const tokenParam = searchParams.get('token');
     if (!tokenParam) {
       setStatus('error');
       setMessage('Invalid url');
       setToken(null);
       return;
     }
     setToken(tokenParam);
   }, [searchParams]);
 
   const handleSubmit = async (event: FormEvent) => {
     event.preventDefault();
 
     if (!token) {
       setStatus('error');
       setMessage('Invalid url');
       return;
     }
 
     if (!password || !repeatPassword) {
       setStatus('error');
       setMessage('Please enter and confirm your new password.');
       return;
     }
 
     if (password !== repeatPassword) {
       setStatus('error');
       setMessage('Passwords do not match.');
       return;
     }
 
     setStatus('submitting');
     setMessage('');
 
     try {
       const response = await apiClient.resetPassword({ token, newPassword: password });
       setStatus('success');
       setMessage(response.message || 'Password reset successfully.');
     } catch (err) {
       const errorWithData = err as Error & { status?: number; errorData?: any };
       const statusCode = errorWithData?.status;
       const errorData = errorWithData?.errorData || {};
       const errorDescription =
         errorData.error_description ||
         errorData.ErrorDescription ||
         errorData.message ||
         'An error occurred. Please try again.';
 
       if (statusCode && statusCode >= 400 && statusCode < 500) {
         setStatus('error');
         setMessage(errorDescription);
       } else {
         setStatus('error');
         setMessage('An error occurred. Please try again.');
       }
     }
   };
 
   return (
     <div className="min-h-screen flex items-center justify-center px-4">
       <div className="max-w-md w-full space-y-8 text-center">
         <div className="space-y-2">
           <h1 className="text-2xl font-semibold">Reset your password</h1>
           <p className="text-gray-600">
             Enter your new password below.
           </p>
         </div>
 
         {status === 'success' ? (
           <div className="space-y-4">
             <div className="text-green-600 text-lg font-semibold">✓ Password Updated</div>
             <p className="text-gray-700">{message}</p>
           </div>
         ) : (
           <form className="space-y-4 text-left" onSubmit={handleSubmit}>
             <div className="space-y-2">
               <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                 New password
               </label>
               <input
                 id="password"
                 name="password"
                 type="password"
                 autoComplete="new-password"
                 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                 value={password}
                 onChange={(event) => setPassword(event.target.value)}
               />
             </div>
 
             <div className="space-y-2">
               <label className="block text-sm font-medium text-gray-700" htmlFor="repeatPassword">
                 Repeat password
               </label>
               <input
                 id="repeatPassword"
                 name="repeatPassword"
                 type="password"
                 autoComplete="new-password"
                 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                 value={repeatPassword}
                 onChange={(event) => setRepeatPassword(event.target.value)}
               />
             </div>
 
             {status === 'error' && (
               <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                 {message}
               </div>
             )}
 
             <button
               type="submit"
               className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
               disabled={status === 'submitting'}
             >
               {status === 'submitting' ? 'Resetting...' : 'Reset Password'}
             </button>
           </form>
         )}
       </div>
     </div>
   );
 }
