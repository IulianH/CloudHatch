import { API_CONFIG } from '@/config/api';
import { buildApiUrl, isRelativeUrl } from './url-utils';

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

export interface RecoveryResult {
  recovered: boolean;
  // True when the refresh endpoint definitively rejected the session with a 4xx
  rejected: boolean;
  // True when the refresh attempt failed with a network/connectivity error
  // (no response / no status code from the server)
  networkError: boolean;
}

export type RefreshFailureCallback = (result: RecoveryResult) => void;

class AuthService {
  private static accessToken: string | null = null;
  private static refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private static refreshFailureCallback: RefreshFailureCallback | null = null;
  private static readonly DELTA = 5000; // 5 seconds
  private static readonly SESSION_FLAG_KEY = 'auth.hasSession';

  // Register a callback invoked when a proactive (timer-driven) refresh
  // fails with a definitive outcome (4xx rejection or network error)
  static setRefreshFailureCallback(callback: RefreshFailureCallback | null): void {
    this.refreshFailureCallback = callback;
  }

  // The refresh token itself lives in an HttpOnly cookie and cannot be
  // inspected from JavaScript. This non-sensitive flag records whether the
  // backend issued a refresh cookie, so anonymous visitors never trigger
  // pointless /web-refresh calls.
  private static hasSessionFlag(): boolean {
    try {
      return window.localStorage.getItem(this.SESSION_FLAG_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private static setSessionFlag(value: boolean): void {
    try {
      if (value) {
        window.localStorage.setItem(this.SESSION_FLAG_KEY, 'true');
      } else {
        window.localStorage.removeItem(this.SESSION_FLAG_KEY);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) - ignore
    }
  }

  // Store authentication data
  // Access token is stored in memory (cleared on page refresh)
  // Refresh token is stored in HttpOnly cookie (set by backend)
  // User data is no longer stored - fetch from profile endpoint when needed
  static setAuthData(data: AuthResponse): void {
    // Store access token in memory
    this.accessToken = data.accessToken;
    this.setSessionFlag(true);

    const delayMilliseconds = (data.expiresIn * 1000 - this.DELTA) / 2;
    // Schedule automatic refresh after 5 minutes (300,000 ms)
    this.scheduleTokenRefresh(delayMilliseconds);
  }

  // Get access token from memory
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  // Get authorization header
  static getAuthHeader(): { Authorization: string } | Record<string, never> {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
  }


  // Check if user is authenticated
  // The access token is required for making authenticated API requests
  static isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // Clear authentication data
  static logout(): void {
    // Clear access token from memory
    this.accessToken = null;
    this.setSessionFlag(false);
    
    // Clear the refresh timeout
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    // Note: HttpOnly refresh token cookie will be cleared by the backend on logout
  }

  // Schedule automatic token refresh
  private static scheduleTokenRefresh(delayMilliseconds: number): void {
    // Clear any existing timeout
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
    }

    // Set new timeout for 5 minutes
    this.refreshTimeoutId = setTimeout(async () => {
      console.log('Auto-refreshing token...');
      const result = await this.refreshTokenIfNeeded();
      if (!result.recovered) {
        console.warn('Auto token refresh failed');
        if (result.rejected || result.networkError) {
          this.refreshFailureCallback?.(result);
        }
      }
    }, delayMilliseconds); 
  }

  // Refresh token using HttpOnly cookie
  // The refresh token cookie is automatically sent by the browser
  // Returns whether the session was definitively rejected (4xx) alongside success
  static async refreshTokenIfNeeded(attemptRecovery: boolean = false): Promise<RecoveryResult> {
    const isAuthenticated = this.isAuthenticated();
    
    if (!attemptRecovery && !isAuthenticated) {
      return { recovered: false, rejected: false, networkError: false };
    }

    try {
      // Use configured refresh endpoint with dynamic URL resolution
      const url = isRelativeUrl(API_CONFIG.REFRESH_URL) ? buildApiUrl(API_CONFIG.REFRESH_URL) : API_CONFIG.REFRESH_URL;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Cache-Control": "no-store"
        },
        credentials: 'include', // Important: Include cookies in the request
      });

      if (response.ok) {
        const data = await response.json();
        this.setAuthData(data);
        return { recovered: true, rejected: false, networkError: false };
      } else if (response.status === 401) {
        // 401 is expected when refresh token is missing or expired
        // This is normal during session recovery attempts, so we handle it silently
        // Only call logout if we had localStorage data (to clean it up)
        
        this.logout();
        
        return { recovered: false, rejected: true, networkError: false };
      } else if (response.status >= 400 && response.status < 500) {
        // Other 4xx statuses mean the session is definitively rejected
        console.error(`Token refresh failed with status ${response.status}`);
        
        this.logout();
        
        return { recovered: false, rejected: true, networkError: false };
      } else {
        // Other error statuses (500, 503, etc.) are unexpected and may be
        // transient server-side failures - keep the current session intact
        console.error(`Token refresh failed with status ${response.status}`);
        
        return { recovered: false, rejected: false, networkError: false };
      }
    } catch (error) {
      // Network errors or other exceptions are unexpected and may be
      // transient - keep the current session intact
      if (isAuthenticated) {
        console.error('Token refresh failed:', error);
      }
      
      return { recovered: false, rejected: false, networkError: true };
    }
  }

  static async attemptSessionRecovery(): Promise<RecoveryResult> {
    // Skip the network call entirely when no refresh cookie was ever issued
    // in this browser. Without this check every anonymous page load would hit
    // the refresh endpoint and get a guaranteed 401.
    if (!this.hasSessionFlag()) {
      this.logout();
      return { recovered: false, rejected: false, networkError: false };
    }
    return this.refreshTokenIfNeeded(true);
  }
}

export default AuthService;
