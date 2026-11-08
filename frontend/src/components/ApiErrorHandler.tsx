'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiErrorEventKind, subscribeToApiErrorEvents } from '@/lib/api-events';
import SessionExpiredModal from './SessionExpiredModal';
import NetworkErrorModal from './NetworkErrorModal';
import ServerErrorModal from './ServerErrorModal';

// Global handler for classified failures of authenticated API requests
// (emitted by ApiClient.authenticatedApiRequest):
// - session-expired: log the user out and show the session-expired modal
// - network-error: show the network error modal (asks to refresh the page)
// - server-error: show the general server error modal
export default function ApiErrorHandler() {
  const { logout } = useAuth();
  const [event, setEvent] = useState<ApiErrorEventKind | null>(null);

  useEffect(() => {
    return subscribeToApiErrorEvents((kind) => {
      if (kind === 'session-expired') {
        void logout();
      }
      setEvent(kind);
    });
  }, [logout]);

  if (event === 'session-expired') {
    return <SessionExpiredModal />;
  }
  if (event === 'network-error') {
    return <NetworkErrorModal />;
  }
  if (event === 'server-error') {
    return <ServerErrorModal onDismiss={() => setEvent(null)} />;
  }
  return null;
}
