import AuthService, { AuthResponse } from './auth';
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
      // Attempt recovery in case localStorage was cleared but cookie still valid
      const refreshed = await AuthService.refreshTokenIfNeeded(true);
      if (!refreshed) {
        AuthService.logout();
        window.location.href = '/';
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
  async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    const url = isRelativeUrl(API_CONFIG.LOGIN_URL) ? buildApiUrl(API_CONFIG.LOGIN_URL) : API_CONFIG.LOGIN_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Important: Receive and store cookies from the server
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorWithStatus = new Error(error.message || 'Login failed') as Error & { status?: number; errorData?: any };
      errorWithStatus.status = response.status;
      errorWithStatus.errorData = error;
      throw errorWithStatus;
    }

    const data = await response.json();
    AuthService.setAuthData(data);
    return data;
  }

  // Federated login method (without credentials)
  async federatedLogin(): Promise<AuthResponse> {
    const url = isRelativeUrl(API_CONFIG.FEDERATED_LOGIN_URL) ? buildApiUrl(API_CONFIG.FEDERATED_LOGIN_URL) : API_CONFIG.FEDERATED_LOGIN_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Cache-Control": "no-store"
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

  // Register method
  async register(credentials: { email: string; password: string }): Promise<{ message: string }> {
    const url = isRelativeUrl(API_CONFIG.REGISTER_URL) ? buildApiUrl(API_CONFIG.REGISTER_URL) : API_CONFIG.REGISTER_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorWithStatus = new Error(error.error_description || error.message || 'Registration failed') as Error & { status?: number; errorData?: any };
      errorWithStatus.status = response.status;
      errorWithStatus.errorData = error;
      throw errorWithStatus;
    }

    return response.json();
  }

  // Confirm email method
  async confirmEmail(token: string): Promise<{ message: string }> {
    const url = isRelativeUrl(API_CONFIG.CONFIRM_EMAIL_URL) ? buildApiUrl(API_CONFIG.CONFIRM_EMAIL_URL) : API_CONFIG.CONFIRM_EMAIL_URL;
    const response = await fetch(`${url}?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        "Cache-Control": "no-store"
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorWithStatus = new Error(error.error_description || error.message || 'Email confirmation failed') as Error & { status?: number; errorData?: any };
      errorWithStatus.status = response.status;
      errorWithStatus.errorData = error;
      throw errorWithStatus;
    }

    return response.json();
  }

  // Send registration email method
  async sendRegistrationEmail(payload: { email: string }): Promise<{ message?: string }> {
    const url = isRelativeUrl(API_CONFIG.SEND_REGISTRATION_EMAIL_URL)
      ? buildApiUrl(API_CONFIG.SEND_REGISTRATION_EMAIL_URL)
      : API_CONFIG.SEND_REGISTRATION_EMAIL_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorWithStatus = new Error(error.error_description || error.message || 'Failed to send registration email') as Error & { status?: number; errorData?: any };
      errorWithStatus.status = response.status;
      errorWithStatus.errorData = error;
      throw errorWithStatus;
    }

    return response.json().catch(() => ({}));
  }

  // Send reset password email method
  async sendResetPasswordEmail(payload: { email: string }): Promise<{ message?: string }> {
    const url = isRelativeUrl(API_CONFIG.SEND_RESET_PASSWORD_EMAIL_URL)
      ? buildApiUrl(API_CONFIG.SEND_RESET_PASSWORD_EMAIL_URL)
      : API_CONFIG.SEND_RESET_PASSWORD_EMAIL_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorWithStatus = new Error(error.error_description || error.message || 'Failed to send reset password email') as Error & { status?: number; errorData?: any };
      errorWithStatus.status = response.status;
      errorWithStatus.errorData = error;
      throw errorWithStatus;
    }

    return response.json().catch(() => ({}));
  }

  // Get user profile
  async getProfile(): Promise<{ name: string; idp: string }> {
    const response = await this.request(API_CONFIG.PROFILE_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return response.json();
  }
}

const apiClient = new ApiClient();
export default apiClient;
