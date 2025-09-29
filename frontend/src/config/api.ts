export const API_CONFIG = {
  // Use relative paths that will be resolved dynamically at runtime
  LOGIN_URL: process.env.NEXT_PUBLIC_LOGIN_URL || '/api/auth/login',
  REFRESH_URL: process.env.NEXT_PUBLIC_REFRESH_URL || '/api/auth/refresh',
  LOGOUT_URL: process.env.NEXT_PUBLIC_LOGOUT_URL || '/api/auth/logout',
  PROFILE_URL: process.env.NEXT_PUBLIC_PROFILE_URL || '/api/Users/profile',
};
