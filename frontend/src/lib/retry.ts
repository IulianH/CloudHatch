// Retry helper for API calls.
// Retries the request up to MAX_RETRIES extra times when the server responds
// with a 5xx status code or when no response is received at all (network
// error, DNS failure, offline, ...). 4xx responses are definitive and are
// returned immediately without retrying.

export const MAX_RETRIES = 2;
export const RETRY_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// True when the attempt is worth retrying: 5xx from the server, or a thrown
// network error (fetch rejects when no response was received at all).
function isRetryable(response: Response | null): boolean {
  if (response === null) {
    return true; // network error: no response at all
  }
  return response.status >= 500 && response.status < 600;
}

/**
 * fetch() wrapper with retry on 5xx / network failure.
 * Performs at most 1 + MAX_RETRIES attempts, waiting RETRY_DELAY_MS between
 * them. The last response (or the last error) is returned/thrown unchanged.
 */
export async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  maxRetries: number = MAX_RETRIES,
  retryDelayMs: number = RETRY_DELAY_MS,
): Promise<Response> {
  let lastError: unknown = null;
  let response: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(retryDelayMs);
    }
    try {
      response = await fetch(input, init);
      if (!isRetryable(response)) {
        return response;
      }
      lastError = null;
    } catch (error) {
      // No response at all (network failure) - retryable
      response = null;
      lastError = error;
    }
  }

  if (lastError !== null) {
    throw lastError;
  }
  return response as Response;
}
