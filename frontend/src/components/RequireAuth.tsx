'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthService from '@/lib/auth';
import apiClient, { ApiError } from '@/lib/api';
import SessionExpiredModal from './SessionExpiredModal';

// Guard for pages that require authentication. On request it:
// - redirects to /login when there is no sign of a session
// - when the in-memory access token is valid, renders immediately and, if
//   we are in the second half of its validity window, refreshes the tokens
//   in the background (fire-and-forget: fetch is async, the call is not
//   awaited and does not block the thread)
// - when the access token is missing or expired, awaits /web-refresh to
//   recover the session; on 401 shows the session-expired modal (logout is
//   called first), on any other error or exception does nothing
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, logout } = useAuth();
  const [ready, setReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (loading || started.current) {
      return;
    }
    started.current = true;

    const checkSession = async () => {
      if (!AuthService.isAuthenticated()) {
        router.replace('/login');
        return;
      }

      if (AuthService.hasValidAccessToken()) {
        if (AuthService.isInSecondHalfOfValidityWindow()) {
          apiClient.refreshTokens().catch((err: unknown) => {
            console.error('Background token refresh failed:', err);
          });
        }
        setReady(true);
        return;
      }

      try {
        await apiClient.refreshTokens();
        setReady(true);
      } catch (err) {
        const status = (err as ApiError).status;
        if (status === 401) {
          await logout();
          setSessionExpired(true);
        }
        // Any other error or exception from /web-refresh: do nothing
      }
    };

    void checkSession();
  }, [loading, logout, router]);

  if (loading || !ready) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p>Loading...</p>
          </div>
        </div>
        {sessionExpired && <SessionExpiredModal />}
      </>
    );
  }

  return (
    <>
      {children}
      {sessionExpired && <SessionExpiredModal />}
    </>
  );
}
