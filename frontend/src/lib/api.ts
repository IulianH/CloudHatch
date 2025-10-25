import AuthService from './auth';
import { API_CONFIG } from '@/config/api';
import { buildApiUrl, isRelativeUrl } from './url-utils';

class ApiClient {
  constructor() {
    // No need to store baseURL anymore - we'll resolve it dynamically
  }

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

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important: Include cookies (for refresh token)
    });

    // Handle 401 responses (token expired)
    if (response.status === 401) {
      // Try to refresh token using the HttpOnly cookie
      const refreshed = await AuthService.refreshTokenIfNeeded();
      if (!refreshed) {
        AuthService.logout();
        window.location.href = '/login';
        throw new Error('Authentication expired');
      }
      
      // Retry the request with the new access token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader(),
          ...options.headers,
        },
        credentials: 'include',
      });
      
      return retryResponse;
    }

    return response;
  }

  // Login method
  async login(credentials: { username: string; password: string }): Promise<{ token: string; user: { id: string; username: string; email?: string } }> {
    const url = isRelativeUrl(API_CONFIG.LOGIN_URL) ? buildApiUrl(API_CONFIG.LOGIN_URL) : API_CONFIG.LOGIN_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Important: Receive and store cookies from the server
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
      // Call logout endpoint - cookies will be sent automatically
      await this.request(API_CONFIG.LOGOUT_URL, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  async getProfile(): Promise<{ id: string; username: string; email?: string }> {
    const response = await this.request(API_CONFIG.PROFILE_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return response.json();
  }
}

const apiClient = new ApiClient();
export default apiClient;
