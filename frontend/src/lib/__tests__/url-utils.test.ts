/**
 * Tests for URL utilities
 * These tests verify that the dynamic URL resolution works correctly
 */

import { getBaseUrl, buildApiUrl, isRelativeUrl, toRelativePath } from '../url-utils';

// Mock window.location for testing
const mockLocation = {
  origin: 'https://example.com',
  href: 'https://example.com/dashboard',
  pathname: '/dashboard',
  search: '',
  hash: '',
};

// Mock window object
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('URL Utils', () => {
  describe('getBaseUrl', () => {
    it('should return window.location.origin on client side', () => {
      expect(getBaseUrl()).toBe('https://example.com');
    });

    it('should handle server-side rendering with environment variable', () => {
      // Mock process.env for server-side
      const originalEnv = process.env;
      process.env = { ...originalEnv, NEXT_PUBLIC_BASE_URL: 'https://api.example.com' };
      
      // Mock window as undefined for server-side
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(getBaseUrl()).toBe('https://api.example.com');
      
      // Restore
      global.window = originalWindow;
      process.env = originalEnv;
    });
  });

  describe('buildApiUrl', () => {
    beforeEach(() => {
      // Reset window.location mock
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });
    });

    it('should build full URL from relative path', () => {
      expect(buildApiUrl('/api/Auth/login')).toBe('https://example.com/api/Auth/login');
      expect(buildApiUrl('api/Users/profile')).toBe('https://example.com/api/Users/profile');
    });
  });

  describe('isRelativeUrl', () => {
    it('should correctly identify relative URLs', () => {
      expect(isRelativeUrl('/api/Auth/login')).toBe(true);
      expect(isRelativeUrl('api/Users/profile')).toBe(true);
      expect(isRelativeUrl('https://example.com/api/Auth/login')).toBe(false);
      expect(isRelativeUrl('http://localhost:3000/api/Auth/login')).toBe(false);
    });
  });

  describe('toRelativePath', () => {
    it('should convert absolute URL to relative path', () => {
      expect(toRelativePath('https://example.com/api/Auth/login')).toBe('/api/Auth/login');
      expect(toRelativePath('http://localhost:3000/api/Users/profile')).toBe('/api/Users/profile');
    });

    it('should return relative path as is', () => {
      expect(toRelativePath('/api/Auth/login')).toBe('/api/Auth/login');
      expect(toRelativePath('api/Users/profile')).toBe('api/Users/profile');
    });
  });
});
