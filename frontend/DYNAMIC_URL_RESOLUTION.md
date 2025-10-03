# Dynamic URL Resolution Implementation

This document describes the implementation of dynamic URL resolution for API requests in the CloudHatch frontend application.

## Overview

The application has been modified to use relative URLs for all API requests and dynamically resolve the base URL at runtime. This approach provides several benefits:

- **Environment Agnostic**: The same code works across development, staging, and production environments
- **Deployment Flexibility**: No need to rebuild the application when deploying to different domains
- **Simplified Configuration**: Reduced environment variable management
- **Better Security**: No hardcoded URLs in the codebase

## Changes Made

### 1. New Utility Functions (`src/lib/url-utils.ts`)

- `getBaseUrl()`: Dynamically determines the base URL from the current request
- `buildApiUrl(relativePath)`: Builds full URLs from relative paths
- `isRelativeUrl(url)`: Checks if a URL is relative
- `toRelativePath(absoluteUrl)`: Converts absolute URLs to relative paths

### 2. Updated API Configuration (`src/config/api.ts`)

All API endpoints now use relative paths:

```typescript
export const API_CONFIG = {
  LOGIN_URL: process.env.NEXT_PUBLIC_LOGIN_URL || '/api/auth/login',
  REFRESH_URL: process.env.NEXT_PUBLIC_REFRESH_URL || '/api/auth/refresh',
  LOGOUT_URL: process.env.NEXT_PUBLIC_LOGOUT_URL || '/api/auth/logout',
  PROFILE_URL: process.env.NEXT_PUBLIC_PROFILE_URL || '/api/Users/profile',
};
```

### 3. Updated ApiClient (`src/lib/api.ts`)

- Removed hardcoded base URL storage
- All requests now use dynamic URL resolution
- Supports both relative and absolute URLs for backward compatibility

### 4. Updated AuthService (`src/lib/auth.ts`)

- Token refresh now uses dynamic URL resolution
- Maintains the same authentication flow with improved flexibility

## How It Works

### Client-Side (Browser)
When running in the browser, the base URL is determined from `window.location.origin`:

```javascript
// If the app is running at https://myapp.com
// All API calls will be made to https://myapp.com/api/...
```

### Server-Side (SSR/API Routes)
When running on the server, the base URL is determined from:

1. `NEXT_PUBLIC_BASE_URL` environment variable (if set)
2. Fallback to `http://localhost:3000` (development default)

### Environment Variables

The following environment variables are now optional and can be used to override default behavior:

```bash
# Optional: Override base URL for server-side rendering
NEXT_PUBLIC_BASE_URL=https://api.myapp.com

# Optional: Override specific API endpoints (if needed)
NEXT_PUBLIC_LOGIN_URL=/api/auth/login
NEXT_PUBLIC_REFRESH_URL=/api/auth/refresh
NEXT_PUBLIC_LOGOUT_URL=/api/auth/logout
NEXT_PUBLIC_PROFILE_URL=/api/Users/profile
```

## Usage Examples

### Basic API Request
```typescript
import ApiClient from '@/lib/api';

// This will automatically resolve to the correct base URL
const response = await ApiClient.request('/api/Users/profile');
```

### Login Request
```typescript
import ApiClient from '@/lib/api';

// This will use the dynamically resolved login URL
const result = await ApiClient.login({
  username: 'user@example.com',
  password: 'password123'
});
```

### Custom API Endpoint
```typescript
import { buildApiUrl } from '@/lib/url-utils';

// Build a custom API URL
const customUrl = buildApiUrl('/api/Custom/endpoint');
```

## Testing

The implementation includes comprehensive tests in `src/lib/__tests__/url-utils.test.ts` that verify:

- Client-side URL resolution
- Server-side URL resolution with environment variables
- Relative URL detection
- URL building functionality

## Benefits

1. **Zero Configuration**: Works out of the box in any environment
2. **Deployment Flexibility**: Same build works across all environments
3. **Maintainability**: No hardcoded URLs to update
4. **Security**: No sensitive URLs exposed in the codebase
5. **Backward Compatibility**: Still supports absolute URLs if needed

## Migration Notes

- All existing API calls will continue to work without changes
- Environment variables are now optional
- The application automatically adapts to the current domain
- No breaking changes to the existing API interface

## Demo

Run the demo script to see how URL resolution works:

```typescript
import { demonstrateUrlResolution } from '@/lib/demo-url-resolution';

// This will log the current URL resolution behavior
demonstrateUrlResolution();
```
