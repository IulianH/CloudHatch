/**
 * Utility functions for handling dynamic URL resolution
 */

/**
 * Get the base URL dynamically from the current request
 * Works both on client-side and server-side
 */
export function getBaseUrl(): string {
  // On the client side
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // On the server side (during SSR or API routes)
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Fallback for server-side rendering
  // This will be used when no environment variable is set
  return 'http://localhost:3000';
}

/**
 * Build a full API URL from a relative path
 * @param relativePath - The relative API path (e.g., '/api/Auth/login')
 * @returns The full URL
 */
export function buildApiUrl(relativePath: string): string {
  const baseUrl = getBaseUrl();
  
  // Ensure the relative path starts with '/'
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Check if a URL is relative (starts with '/')
 * @param url - The URL to check
 * @returns True if the URL is relative
 */
export function isRelativeUrl(url: string): boolean {
  return url.startsWith('/');
}

/**
 * Convert an absolute URL to a relative path
 * @param absoluteUrl - The absolute URL
 * @returns The relative path
 */
export function toRelativePath(absoluteUrl: string): string {
  try {
    const url = new URL(absoluteUrl);
    return url.pathname;
  } catch {
    // If it's already a relative path, return as is
    return absoluteUrl;
  }
}
