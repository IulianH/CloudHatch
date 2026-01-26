import dotenv from "dotenv";

import { RegistrationEmailSettings, ResetPasswordEmailSettings } from "./email";
import { JwtConfig } from "./jwt";
import { LoginSettings } from "./login";
import { defaultGoogleOAuthConfig, defaultMicrosoftOAuthConfig, GoogleOAuthConfig, MicrosoftOAuthConfig } from "./oauth";
import { RefreshTokenConfig } from "./refreshToken";
import { RegisterSettings } from "./register";
import { ResetPasswordSettings } from "./resetPassword";

const environment = process.env.NODE_ENV?.toLowerCase();
if (environment === "development") {
  dotenv.config({ path: ".env.development" });
}
dotenv.config();

export interface AuthCookieConfig {
  name: string;
  maxAgeHours: number;
}

export interface CookieProtectionConfig {
  secretKey: Buffer;
}

export interface OriginConfig {
  host: string;
  federationSuccessPath: string;
}

export interface AppConfig {
  jwt: JwtConfig;
  refreshToken: RefreshTokenConfig;
  authCookie: AuthCookieConfig;
  cookieProtection: CookieProtectionConfig;
  origin: OriginConfig;
  login: LoginSettings;
  register: RegisterSettings;
  registrationEmail: RegistrationEmailSettings;
  resetPassword: ResetPasswordSettings;
  resetPasswordEmail: ResetPasswordEmailSettings;
  googleOAuth: GoogleOAuthConfig;
  microsoftOAuth: MicrosoftOAuthConfig;
}

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
};

const optionalEnv = (name: string, fallback: string): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
};

const parseNumber = (name: string, value: string): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value for ${name}: ${value}`);
  }
  return parsed;
};

const optionalNumber = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }
  return parseNumber(name, raw.trim());
};

const optionalBoolean = (name: string, fallback: boolean): boolean => {
  const raw = process.env[name];
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }
  return raw.trim().toLowerCase() === "true" || raw.trim() === "1";
};

const requireBase64Key = (name: string, bytes: number): Buffer => {
  const raw = requireEnv(name);
  const buffer = Buffer.from(raw, "base64");
  if (buffer.length !== bytes) {
    throw new Error(
      `${name} must decode to ${bytes} bytes (got ${buffer.length})`,
    );
  }
  return buffer;
};

export const loadConfig = (): AppConfig => ({
  jwt: {
    key: optionalEnv("JWT_KEY", ""),
    issuer: optionalEnv("JWT_ISSUER", "https://app.example.com"),
    audience: optionalEnv("JWT_AUDIENCE", "drive-api"),
    expiresInSeconds: optionalNumber("JWT_EXPIRES_IN_SECONDS", 900),
  },
  refreshToken: {
    expiresInHours: optionalNumber("RT_EXPIRES_IN_HOURS", 720),
    sessionMaxAgeHours: optionalNumber("RT_SESSION_MAX_AGE_HOURS", 0),
  },
  authCookie: {
    name: optionalEnv("AUTH_COOKIE_NAME", "auth"),
    maxAgeHours: optionalNumber("AUTH_COOKIE_MAX_AGE_HOURS", 720),
  },
  cookieProtection: {
    secretKey: requireBase64Key("AUTH_COOKIE_SECRET_BASE64", 32),
  },
  origin: {
    host: optionalEnv("ORIGIN_HOST", "localhost"),
    federationSuccessPath: optionalEnv(
      "ORIGIN_FEDERATION_SUCCESS_PATH",
      "/federatedLogin",
    ),
  },
  login: {
    maxFailedPasswordLoginAttempts: optionalNumber(
      "LOGIN_MAX_FAILED_ATTEMPTS",
      6,
    ),
    accountLockDurationInMinutes: optionalNumber(
      "LOGIN_ACCOUNT_LOCK_DURATION_MINUTES",
      1,
    ),
    lockoutStartsAfterAttempts: optionalNumber(
      "LOGIN_LOCKOUT_STARTS_AFTER_ATTEMPTS",
      3,
    ),
  },
  register: {
    emailConfirmationTokenExpiresInHours: optionalNumber(
      "REGISTER_EMAIL_CONFIRM_TOKEN_EXPIRES_HOURS",
      72,
    ),
    emailConfirmUrl: optionalEnv(
      "REGISTER_EMAIL_CONFIRM_URL",
      "https://localhost/confirmEmail",
    ),
  },
  registrationEmail: {
    maxRegistrationEmailsPerDay: optionalNumber(
      "REGISTRATION_EMAIL_MAX_PER_DAY",
      15,
    ),
    resendConfirmationEmailCooldownInSeconds: optionalNumber(
      "REGISTRATION_EMAIL_RESEND_COOLDOWN_SECONDS",
      15,
    ),
    from: optionalEnv("REGISTRATION_EMAIL_FROM", "no-reply@cloudhatch.com"),
    subject: optionalEnv("REGISTRATION_EMAIL_SUBJECT", "Confirm your email"),
  },
  resetPassword: {
    resetPasswordUrl: optionalEnv(
      "RESET_PASSWORD_URL",
      "https://localhost/resetPassword",
    ),
    resetPasswordTokenExpiresInMinutes: optionalNumber(
      "RESET_PASSWORD_TOKEN_EXPIRES_MINUTES",
      15,
    ),
  },
  resetPasswordEmail: {
    maxEmailsPerDay: optionalNumber("RESET_PASSWORD_EMAIL_MAX_PER_DAY", 10),
    from: optionalEnv("RESET_PASSWORD_EMAIL_FROM", "no-reply@cloudhatch.com"),
    subject: optionalEnv("RESET_PASSWORD_EMAIL_SUBJECT", "Reset your password"),
  },
  googleOAuth: {
    ...defaultGoogleOAuthConfig,
    enabled: optionalBoolean("GOOGLE_OAUTH_ENABLED", false),
    clientId: optionalEnv("GOOGLE_OAUTH_CLIENT_ID", ""),
    clientSecret: optionalEnv("GOOGLE_OAUTH_CLIENT_SECRET", ""),
  },
  microsoftOAuth: {
    ...defaultMicrosoftOAuthConfig,
    enabled: optionalBoolean("MICROSOFT_OAUTH_ENABLED", false),
    clientId: optionalEnv("MICROSOFT_OAUTH_CLIENT_ID", ""),
    clientSecret: optionalEnv("MICROSOFT_OAUTH_CLIENT_SECRET", ""),
  },
});

export const config = loadConfig();
