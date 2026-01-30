import dotenv from "dotenv";

export interface JwtConfig {
  key: string;
  issuer: string;
  audience: string;
}

export interface AppConfig {
  jwt: JwtConfig;
}

const environment = process.env.NODE_ENV?.toLowerCase();
if (environment === "development") {
  dotenv.config({ path: ".env.development" });
}
dotenv.config();

const optionalEnv = (name: string, fallback: string): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
};

export const loadConfig = (): AppConfig => ({
  jwt: {
    key: optionalEnv("JWT_KEY", ""),
    issuer: optionalEnv("JWT_ISSUER", "https://app.example.com"),
    audience: optionalEnv("JWT_AUDIENCE", "drive-api"),
  },
});

export const config = loadConfig();
