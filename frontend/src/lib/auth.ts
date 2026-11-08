export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

class AuthService {
  private static accessToken: string | null = null;
  private static readonly SESSION_FLAG_KEY = 'auth.hasSession';
  private static readonly TOKEN_RECEIVED_AT_KEY = 'auth.tokenReceivedAt';
  private static readonly ACCESS_TOKEN_VALIDITY_KEY = 'auth.accessTokenValiditySeconds';

  // The refresh token itself lives in an HttpOnly cookie and cannot be
  // inspected from JavaScript. This non-sensitive flag records whether the
  // backend issued a refresh cookie.
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
    try {
      window.localStorage.setItem(this.TOKEN_RECEIVED_AT_KEY, String(Date.now()));
      window.localStorage.setItem(this.ACCESS_TOKEN_VALIDITY_KEY, String(Math.max(data.expiresIn - 10, 0)));
    } catch {
      // localStorage unavailable (private mode, etc.) - ignore
    }
  }

  // Get access token from memory
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  // Authenticated when the session flag is in localStorage; when
  // localStorage is unavailable, fall back to the in-memory access token
  static isAuthenticated(): boolean {
    try {
      return window.localStorage.getItem(this.SESSION_FLAG_KEY) === 'true';
    } catch {
      return this.accessToken !== null;
    }
  }

  // True when an in-memory access token exists and the stored markers say
  // it is still within its validity window. If the markers are missing or
  // cannot be retrieved, the token is treated as expired so the caller
  // falls back to /web-refresh.
  static hasValidAccessToken(): boolean {
    if (this.accessToken === null) {
      return false;
    }
    try {
      const receivedAt = Number(window.localStorage.getItem(this.TOKEN_RECEIVED_AT_KEY));
      const validitySeconds = Number(window.localStorage.getItem(this.ACCESS_TOKEN_VALIDITY_KEY));
      if (Number.isNaN(receivedAt) || Number.isNaN(validitySeconds)) {
        return false;
      }
      return Date.now() < receivedAt + validitySeconds * 1000;
    } catch {
      return false;
    }
  }

  // True when the current time is in the second half of the access token
  // validity window (i.e. it is time to refresh in the background)
  static isInSecondHalfOfValidityWindow(): boolean {
    try {
      const receivedAt = Number(window.localStorage.getItem(this.TOKEN_RECEIVED_AT_KEY));
      const validitySeconds = Number(window.localStorage.getItem(this.ACCESS_TOKEN_VALIDITY_KEY));
      if (Number.isNaN(receivedAt) || Number.isNaN(validitySeconds)) {
        return false;
      }
      return Date.now() >= receivedAt + (validitySeconds * 1000) / 2;
    } catch {
      return false;
    }
  }

  // Get authorization header
  static getAuthHeader(): { Authorization: string } | Record<string, never> {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
  }

  // Clear authentication data
  static logout(): void {
    // Clear access token from memory
    this.accessToken = null;
    this.setSessionFlag(false);
    try {
      window.localStorage.removeItem(this.TOKEN_RECEIVED_AT_KEY);
      window.localStorage.removeItem(this.ACCESS_TOKEN_VALIDITY_KEY);
    } catch {
      // localStorage unavailable (private mode, etc.) - ignore
    }
    // Note: HttpOnly refresh token cookie will be cleared by the backend on logout
  }
}

export default AuthService;
