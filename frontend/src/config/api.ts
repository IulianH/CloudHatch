export const API_CONFIG = {
  // Use relative paths that will be resolved dynamically at runtime
  LOGIN_URL: process.env.NEXT_PUBLIC_LOGIN_URL || '/api/auth/web-login',
  FEDERATED_LOGIN_URL: process.env.NEXT_PUBLIC_FEDERATED_LOGIN_URL || '/api/auth/web-federated-login',
  REFRESH_URL: process.env.NEXT_PUBLIC_REFRESH_URL || '/api/auth/web-refresh',
  LOGOUT_URL: process.env.NEXT_PUBLIC_LOGOUT_URL || '/api/auth/web-logout',
  PROFILE_URL: process.env.NEXT_PUBLIC_PROFILE_URL || '/api/backapi/profile',
  GOOGLE_OAUTH_URL: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL || '/api/auth/web-google-challenge',
  MICROSOFT_OAUTH_URL: process.env.NEXT_PUBLIC_MICROSOFT_OAUTH_URL || '/api/auth/web-microsoft-challenge',
  REGISTER_URL: process.env.NEXT_PUBLIC_REGISTER_URL || '/api/auth/register',
  CONFIRM_EMAIL_URL: process.env.NEXT_PUBLIC_CONFIRM_EMAIL_URL || '/api/auth/confirm-email',
  SEND_REGISTRATION_EMAIL_URL: process.env.NEXT_PUBLIC_SEND_REGISTRATION_EMAIL_URL || '/api/auth/send-registration-email',
  SEND_RESET_PASSWORD_EMAIL_URL: process.env.NEXT_PUBLIC_SEND_RESET_PASSWORD_EMAIL_URL || '/api/auth/send-reset-password-email'
};
