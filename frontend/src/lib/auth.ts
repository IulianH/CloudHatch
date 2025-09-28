import { API_CONFIG } from '@/config/api';
import { buildApiUrl, isRelativeUrl } from './url-utils';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number; // seconds until expiration
  expiresAt?: string; // ISO date string when token expires
  user?: {
    id: string;
    username: string;
    email?: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  // Store authentication data using server-provided expiration
  static setAuthData(data: AuthResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
      
      // Use server-provided expiration
      if (data.expiresIn) {
        // Server provides seconds until expiration
        const expiryTime = Date.now() + (data.expiresIn * 1000);
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      } else if (data.expiresAt) {
        // Server provides ISO date string
        const expiryTime = new Date(data.expiresAt).getTime();
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      
      if (data.user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
      }

      // Set refresh token in cookie
      this.setRefreshTokenCookie(data.refreshToken);
    }
  }

  // Set refresh token in cookie
  private static setRefreshTokenCookie(token: string): void {
    if (typeof document !== 'undefined') {
      // Set cookie with httpOnly-like properties
      document.cookie = `refresh_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Strict`;
    }
  }

  // Get stored access token
  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  // Get refresh token from cookie or localStorage
  static getRefreshToken(): string | null {
    if (typeof document !== 'undefined') {
      // Try to get from cookie first
      const cookies = document.cookie.split(';');
      const refreshTokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('refresh_token=')
      );
      
      if (refreshTokenCookie) {
        return refreshTokenCookie.split('=')[1];
      }
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  // Get stored user data
  static getUser(): any | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    // Check if token is expired using server-provided expiration
    return !this.isAccessTokenExpired();
  }

  // Check if access token is expired using server expiration
  static isAccessTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    
    // Add a small buffer (5 minutes) to refresh before actual expiration
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() > (parseInt(expiry) - bufferTime);
  }

  // Get time until token expires (useful for debugging)
  static getTimeUntilExpiry(): number | null {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return null;
    
    const timeLeft = parseInt(expiry) - Date.now();
    return timeLeft > 0 ? timeLeft : 0;
  }

  // Clear authentication data
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    
    // Clear cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  // Get authorization header
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Auto-refresh token if needed
  static async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.isAccessTokenExpired()) {
      return true; // Token is still valid
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false; // No refresh token available
    }

    try {
      // Use configured refresh endpoint with dynamic URL resolution
      const url = isRelativeUrl(API_CONFIG.REFRESH_URL) ? buildApiUrl(API_CONFIG.REFRESH_URL) : API_CONFIG.REFRESH_URL;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
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
