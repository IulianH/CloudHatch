export interface ApiErrorBody {
  error?: string;
  error_description?: string;
  ErrorDescription?: string;
  Error?: string;
  message?: string;
}

export type ApiError = Error & { status?: number; errorData?: ApiErrorBody };

// Classification of a failed authenticated API request:
// - 'unauthorized': the server answered 401 (session expired)
// - 'network': no response at all (server unreachable, offline, DNS, ...)
// - 'server': the server answered 5xx
// - 'other': any other non-OK response
export type ApiRequestErrorKind = 'unauthorized' | 'network' | 'server' | 'other';

export type ApiRequestError = ApiError & { kind: ApiRequestErrorKind };

import AuthService, { AuthResponse } from './auth';
import { API_CONFIG } from '@/config/api';
import { buildApiUrl, isRelativeUrl } from './url-utils';
import { fetchWithRetry } from './retry';
import { ApiErrorEventKind, emitApiErrorEvent } from './api-events';

const API_REQUEST_ERROR_EVENT: Partial<Record<ApiRequestErrorKind, ApiErrorEventKind>> = {
  unauthorized: 'session-expired',
  network: 'network-error',
  server: 'server-error',
};

// NodeAuth requires this custom header on state-changing POSTs as CSRF
// protection: cross-site pages cannot attach custom headers without a CORS
// preflight, which NodeAuth only approves for this app's origin.
const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' } as const;

class ApiClient {
  // Single-flight guard: concurrent callers share one /web-refresh call
  // instead of firing duplicate refreshes (NodeAuth rotates the refresh
  // token, so a duplicate refresh can fail with 401)
  private refreshPromise: Promise<AuthResponse> | null = null;

  // Make authenticated API requests
  // Access token is sent in Authorization header
  // Refresh token is in HttpOnly cookie sent automatically
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Resolve the URL dynamically - handle both relative and absolute URLs
    const url = isRelativeUrl(endpoint) ? buildApiUrl(endpoint) : endpoint;

    const headers = {
      'Content-Type': 'application/json',
      ...AuthService.getAuthHeader(),
      ...options.headers,
    };

    return fetchWithRetry(url, {
      ...options,
      headers,
      credentials: 'include', // Important: Include cookies (for refresh token)
    });
  }

  // General behavior for any authenticated API call ("authenticated api
  // request"):
  // 1. Ensure the in-memory access token is valid, recovering it via
  //    /web-refresh when it is missing or expired.
  // 2. Perform the specific API call.
  // 3. Classify the outcome: 401 means the session expired, a thrown fetch
  //    means a network error (no response at all), 5xx means a server
  //    error. The UI layer is notified via api-events so it can log the user
  //    out and show the session-expired / network-error / server-error
  //    modal; the typed ApiRequestError is rethrown for the caller.
  async authenticatedApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!AuthService.hasValidAccessToken()) {
      try {
        await this.refreshTokens();
      } catch (error) {
        const apiError = error as ApiError;
        throw this.toApiRequestError(error, apiError.status, apiError.errorData);
      }
    }

    let response: Response;
    try {
      response = await this.request(endpoint, options);
    } catch (error) {
      // fetch rejects only when no response was received at all
      throw this.toApiRequestError(error);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as ApiErrorBody;
      throw this.toApiRequestError(
        new Error(errorBody.message || `Request failed with status ${response.status}`),
        response.status,
        errorBody,
      );
    }

    return response.json() as Promise<T>;
  }

  private toApiRequestError(error: unknown, status?: number, errorData?: ApiErrorBody): ApiRequestError {
    const message = error instanceof Error ? error.message : String(error);
    const kind: ApiRequestErrorKind =
      status === undefined
        ? 'network'
        : status === 401
          ? 'unauthorized'
          : status >= 500 && status < 600
            ? 'server'
            : 'other';
    const apiError = new Error(message) as ApiRequestError;
    apiError.kind = kind;
    apiError.status = status;
    apiError.errorData = errorData;
    const eventKind = API_REQUEST_ERROR_EVENT[kind];
    if (eventKind) {
      emitApiErrorEvent(eventKind);
    }
    return apiError;
  }

  // Federated login method (without credentials)
  async federatedLogin(): Promise<AuthResponse> {
    const url = isRelativeUrl(API_CONFIG.FEDERATED_LOGIN_URL) ? buildApiUrl(API_CONFIG.FEDERATED_LOGIN_URL) : API_CONFIG.FEDERATED_LOGIN_URL;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Cache-Control": "no-store",
        ...CSRF_HEADER,
      },
      credentials: 'include', // Important: Receive and store cookies from the server
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Federated login failed');
    }

    const data = await response.json();
    AuthService.setAuthData(data);
    return data;
  }

  // Refresh the token pair via NodeAuth /web-refresh.
  // On success behaves like post-federated-login: stores the new access
  // token and refreshes the received-at / validity-window markers.
  // 401 means the session is expired; 5xx/exception means a server error.
  async refreshTokens(): Promise<AuthResponse> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.performRefreshTokens();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefreshTokens(): Promise<AuthResponse> {
    const url = isRelativeUrl(API_CONFIG.REFRESH_URL) ? buildApiUrl(API_CONFIG.REFRESH_URL) : API_CONFIG.REFRESH_URL;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Cache-Control": "no-store",
        ...CSRF_HEADER,
      },
      credentials: 'include', // Send the HttpOnly refresh cookie
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as ApiErrorBody;
      const apiError: ApiError = new Error(errorBody.message || 'Token refresh failed');
      apiError.status = response.status;
      apiError.errorData = errorBody;
      throw apiError;
    }

    const data = await response.json() as AuthResponse;
    AuthService.setAuthData(data);
    return data;
  }

  // Logout method
  async logout(): Promise<void> {
    try {
      // Call logout endpoint - cookies will be sent automatically
      await this.request(API_CONFIG.LOGOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...CSRF_HEADER,
        },
        body: JSON.stringify({"logoutAll": true}),
        credentials: 'include'
      });
    } catch {
      console.warn('Logout endpoint not available');
    } finally {
      AuthService.logout();
    }
  }

  // Get user profile
  async getProfile(): Promise<{ name: string; idp: string }> {
    return this.authenticatedApiRequest<{ name: string; idp: string }>(API_CONFIG.PROFILE_URL);
  }
}

const apiClient = new ApiClient();
export default apiClient;
