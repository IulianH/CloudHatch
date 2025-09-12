export const API_CONFIG = {
  LOGIN_URL: process.env.NEXT_PUBLIC_LOGIN_URL || 'https://localhost:44373/api/Auth/login',
  REFRESH_URL: process.env.NEXT_PUBLIC_REFRESH_URL || 'https://localhost:44373/api/Auth/refresh',
  LOGOUT_URL: process.env.NEXT_PUBLIC_LOGOUT_URL || 'https://localhost:44373/api/Auth/logout',
  PROFILE_URL: process.env.NEXT_PUBLIC_PROFILE_URL || 'https://localhost:44375/api/Users/profile',
};
