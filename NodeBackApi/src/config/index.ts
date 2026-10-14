import dotenv from "dotenv";
import path from "path";

export interface JwtConfig {
  key: string;
  issuer: string;
  audience: string;
}

export interface OriginConfig {
  webClientAppOrigin: string;
}

export interface PostgresConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  useSsl: boolean;
}

export interface AppConfig {
  postgres: PostgresConfig;
  jwt: JwtConfig;
  origin: OriginConfig;
}

const environment = process.env.NODE_ENV?.toLowerCase();
const projectRoot = path.resolve(__dirname, "..", "..");

if (environment === "development") {
  dotenv.config({ path: path.join(projectRoot, ".env.development") });
}
dotenv.config({ path: path.join(projectRoot, ".env") });

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

export const loadConfig = (): AppConfig => ({
  postgres: {
    host: requireEnv("POSTGRES_HOST"),
    port: optionalNumber("POSTGRES_PORT", 5432),
    user: requireEnv("POSTGRES_USER"),
    password: requireEnv("POSTGRES_PASSWORD"),
    database: requireEnv("POSTGRES_DATABASE"),
    useSsl: optionalBoolean("POSTGRES_USE_SSL", true),
  },
  jwt: {
    key: requireEnv("JWT_KEY"),
    issuer: optionalEnv("JWT_ISSUER", "https://app.example.com"),
    audience: optionalEnv("JWT_AUDIENCE", "drive-api"),
  },
  origin: {
    // Origin of the web client app (frontend) allowed to call this
    // service cross-origin with credentials. Empty string disables CORS
    // headers entirely (same-origin setups).
    webClientAppOrigin: optionalEnv("WEB_CLIENT_APP_ORIGIN", "").replace(
      new RegExp("/+$"),
      "",
    ),
  },
});

export const config = loadConfig();
