// Typed event bus used by the API layer to notify the UI about classified
// failures of authenticated API requests, so the lib layer stays free of
// React dependencies while any component can react (e.g. show a modal).

export type ApiErrorEventKind = 'session-expired' | 'network-error' | 'server-error';

type ApiErrorEventListener = (kind: ApiErrorEventKind) => void;

const listeners = new Set<ApiErrorEventListener>();

export function emitApiErrorEvent(kind: ApiErrorEventKind): void {
  for (const listener of listeners) {
    listener(kind);
  }
}

export function subscribeToApiErrorEvents(listener: ApiErrorEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
