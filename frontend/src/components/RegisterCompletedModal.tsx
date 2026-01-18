'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
 
 interface RegisterCompletedModalProps {
   isOpen: boolean;
   email: string;
   onClose: () => void;
 }
 
const RESEND_COOLDOWN_SECONDS = 20;

function getCooldownKey(email: string) {
  return `register-resend-next-${email.toLowerCase()}`;
}

function getRemainingSeconds(email: string) {
  if (!email) {
    return 0;
  }
  const raw = window.localStorage.getItem(getCooldownKey(email));
  const nextAllowedMs = raw ? Number(raw) : 0;
  const diffMs = nextAllowedMs - Date.now();
  return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
}

function ensureNextAllowedMs(email: string) {
  if (!email) {
    return 0;
  }
  const raw = window.localStorage.getItem(getCooldownKey(email));
  const parsed = raw ? Number(raw) : 0;
  if (Number.isNaN(parsed) || parsed <= 0) {
    const nextAllowed = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
    window.localStorage.setItem(getCooldownKey(email), String(nextAllowed));
    return nextAllowed;
  }
  return parsed;
}

 export default function RegisterCompletedModal({
   isOpen,
   email,
   onClose,
 }: RegisterCompletedModalProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
 
   useEffect(() => {
     if (!isOpen) {
       return;
     }
 
    setResendError(null);
    const nextAllowed = ensureNextAllowedMs(email);
    const initialRemaining =
      nextAllowed > 0 ? Math.max(0, Math.ceil((nextAllowed - Date.now()) / 1000)) : 0;
    setRemainingSeconds(initialRemaining);

    const intervalId = window.setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(email));
    }, 1000);
 
     return () => {
       window.clearInterval(intervalId);
     };
  }, [isOpen, email, timerKey]);
 
   if (!isOpen) {
     return null;
   }
 
  const isResendDisabled = remainingSeconds > 0 || isResending;

  const handleResend = async () => {
    if (isResendDisabled) {
      return;
    }

    setIsResending(true);
    setResendError(null);

    try {
      await apiClient.sendRegistrationEmail({ email });
      const nextAllowed = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      window.localStorage.setItem(getCooldownKey(email), String(nextAllowed));
      setTimerKey((prev) => prev + 1);
    } catch (err) {
      const errorWithData = err as Error & { status?: number; errorData?: any };
      const errorMessage =
        errorWithData.errorData?.error_description ||
        errorWithData.errorData?.error ||
        errorWithData.message ||
        'Failed to resend email.';
      setResendError(errorMessage);
    } finally {
      setIsResending(false);
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
             Registration Complete
           </div>
           <p className="text-gray-700">
             Follow the link that was sent to {email} to complete the registration.
           </p>
           <div className="space-y-2">
            <button
              type="button"
              disabled={isResendDisabled}
              onClick={handleResend}
              className="w-full border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Resending...' : 'Resend'}
            </button>
            <div className="text-sm text-gray-600">
              {isResendDisabled ? `Resend available in ${remainingSeconds}s` : 'You can resend now.'}
            </div>
            {resendError && (
              <div className="text-sm text-red-600">
                {resendError}
              </div>
            )}
           </div>
         </div>
       </div>
     </div>
   );
 }
