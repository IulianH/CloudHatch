import { API_CONFIG } from '@/config/api';
import { buildApiUrl, isRelativeUrl } from './url-utils';

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user?: {
    username: string;
    email?: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class AuthService {
  private static readonly USER_KEY = 'user_data';
  private static accessToken: string | null = null;
  private static refreshTimeoutId: NodeJS.Timeout | null = null;
  private static readonly DELTA = 15000; // 15 seconds

  // Store authentication data
  // Access token is stored in memory (cleared on page refresh)
  // Refresh token is stored in HttpOnly cookie (set by backend)
  // User data is stored in localStorage for persistence
  static setAuthData(data: AuthResponse): void {
    // Store access token in memory
    this.accessToken = data.accessToken;
    
    // Store user data in localStorage
    if (typeof window !== 'undefined') {
      if (data.user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
      }
    }

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

  // Get stored user data
  static getUser(): { id: string; username: string; email?: string } | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  // Check if user is authenticated
  // Since tokens are in HttpOnly cookies, we check if user data exists
  static isAuthenticated(): boolean {
    return this.getUser() !== null;
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
    
    // Clear user data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
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
  static async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false; // No user session
    }

    try {
      // Use configured refresh endpoint with dynamic URL resolution
      const url = isRelativeUrl(API_CONFIG.REFRESH_URL) ? buildApiUrl(API_CONFIG.REFRESH_URL) : API_CONFIG.REFRESH_URL;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies in the request
      });

      if (response.ok) {
        const data = await response.json();
        this.setAuthData(data);
        return true;
      } else {
        // Refresh failed, user needs to login again
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return false;
    }
  }
}

export default AuthService;
