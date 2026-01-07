import { API_CONFIG } from '@/config/api';
import { buildApiUrl, isRelativeUrl } from './url-utils';

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class AuthService {
  private static accessToken: string | null = null;
  private static refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private static readonly DELTA = 5000; // 5 seconds

  // Store authentication data
  // Access token is stored in memory (cleared on page refresh)
  // Refresh token is stored in HttpOnly cookie (set by backend)
  // User data is no longer stored - fetch from profile endpoint when needed
  static setAuthData(data: AuthResponse): void {
    // Store access token in memory
    this.accessToken = data.accessToken;

    const delayMilliseconds = data.expiresIn * 1000 - this.DELTA; 
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
      const success = await this.refreshTokenIfNeeded();
      if (!success) {
        console.warn('Auto token refresh failed');
      }
    }, delayMilliseconds); 
  }

  // Refresh token using HttpOnly cookie
  // The refresh token cookie is automatically sent by the browser
  static async refreshTokenIfNeeded(attemptRecovery: boolean = false): Promise<boolean> {
    const isAuthenticated = this.isAuthenticated();
    
    if (!attemptRecovery && !isAuthenticated) {
      return false;
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
        return true;
      } else if (response.status === 401) {
        // 401 is expected when refresh token is missing or expired
        // This is normal during session recovery attempts, so we handle it silently
        // Only call logout if we had localStorage data (to clean it up)
        
        this.logout();
        
        return false;
      } else {
        // Other error statuses (500, 503, etc.) are unexpected
        console.error(`Token refresh failed with status ${response.status}`);
        
        this.logout();
        
        return false;
      }
    } catch (error) {
      // Network errors or other exceptions are unexpected
      // Only log if we had localStorage (meaning we expected a valid session)
      if (isAuthenticated) {
        console.error('Token refresh failed:', error);
      }
      // Only call logout if we had localStorage data
      
      this.logout();
      
      return false;
    }
  }

  static async attemptSessionRecovery(): Promise<boolean> {
    return this.refreshTokenIfNeeded(true);
  }
}

export default AuthService;
