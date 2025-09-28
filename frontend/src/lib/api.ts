import AuthService from './auth';
import { API_CONFIG } from '@/config/api';
import { buildApiUrl, isRelativeUrl } from './url-utils';

class ApiClient {
  constructor() {
    // No need to store baseURL anymore - we'll resolve it dynamically
  }

  // Make authenticated API requests with automatic token refresh
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Resolve the URL dynamically - handle both relative and absolute URLs
    const url = isRelativeUrl(endpoint) ? buildApiUrl(endpoint) : endpoint;
    
    // Check if we need to refresh the token
    if (AuthService.isAccessTokenExpired()) {
      const refreshed = await AuthService.refreshTokenIfNeeded();
      if (!refreshed) {
        // Redirect to login if refresh failed
        window.location.href = '/login';
        throw new Error('Authentication expired');
      }
    }
    
    // Add authentication header
    const headers = {
      'Content-Type': 'application/json',
      ...AuthService.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 responses (token expired)
    if (response.status === 401) {
      // Try to refresh token once more
      const refreshed = await AuthService.refreshTokenIfNeeded();
      if (!refreshed) {
        AuthService.logout();
        window.location.href = '/login';
        throw new Error('Authentication expired');
      }
      
      // Retry the request with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader(),
          ...options.headers,
        },
      });
      
      return retryResponse;
    }

    return response;
  }

  // Login method
  async login(credentials: { username: string; password: string }): Promise<any> {
    const url = isRelativeUrl(API_CONFIG.LOGIN_URL) ? buildApiUrl(API_CONFIG.LOGIN_URL) : API_CONFIG.LOGIN_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    AuthService.setAuthData(data);
    return data;
  }

  // Logout method
  async logout(): Promise<void> {
    try {
      // Get refresh token to send in request body
      const refreshToken = AuthService.getRefreshToken();
      
      // Call logout endpoint using configured URL with refresh token in body
      await this.request(API_CONFIG.LOGOUT_URL, { 
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      console.warn('Logout endpoint not available');
    } finally {
      AuthService.logout();
    }
  }

  // Get user profile
  async getProfile(): Promise<any> {
    const response = await this.request(API_CONFIG.PROFILE_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return response.json();
  }
}

export default new ApiClient();
