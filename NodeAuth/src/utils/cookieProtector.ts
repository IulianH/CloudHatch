import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import type { Request } from "express";

import type {
  AuthCookieConfig,
  CookieProtectionConfig,
  OriginConfig,
} from "../config";

const cookiePath = "/api/auth";
const payloadVersion = 1;
const cipherAlgorithm = "aes-256-gcm";
const ivLength = 12;

type RefreshCookiePayload = {
  rt: string;
  v: number;
};

const toBase64 = (value: Buffer): string => value.toString("base64");
const fromBase64 = (value: string): Buffer => Buffer.from(value, "base64");

const encodeCookieValue = (value: string): string => encodeURIComponent(value);
const decodeCookieValue = (value: string): string => decodeURIComponent(value);

const encrypt = (plaintext: string, key: Buffer): string => {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(cipherAlgorithm, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [toBase64(iv), toBase64(tag), toBase64(ciphertext)].join(".");
};

const decrypt = (encoded: string, key: Buffer): string | null => {
  const [ivB64, tagB64, dataB64] = encoded.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    return null;
  }
  try {
    const iv = fromBase64(ivB64);
    const tag = fromBase64(tagB64);
    const data = fromBase64(dataB64);
    const decipher = createDecipheriv(cipherAlgorithm, key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    return null;
  }
};

const serializeCookie = (
  name: string,
  value: string,
  options: {
    domain?: string;
    maxAgeSeconds?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    path?: string;
  },
): string => {
  const parts = [`${name}=${encodeCookieValue(value)}`];
  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  if (typeof options.maxAgeSeconds === "number") {
    parts.push(`Max-Age=${Math.floor(options.maxAgeSeconds)}`);
  }
  if (options.httpOnly) {
    parts.push("HttpOnly");
  }
  if (options.secure) {
    parts.push("Secure");
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }
  return parts.join("; ");
};

const parseCookieHeader = (cookieHeader: string): Record<string, string> => {
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .reduce<Record<string, string>>((acc, chunk) => {
      const separatorIndex = chunk.indexOf("=");
      if (separatorIndex <= 0) {
        return acc;
      }
      const name = chunk.slice(0, separatorIndex).trim();
      const value = chunk.slice(separatorIndex + 1).trim();
      if (name) {
        acc[name] = decodeCookieValue(value);
      }
      return acc;
    }, {});
};

const buildCookiePayload = (refreshToken: string): RefreshCookiePayload => ({
  rt: refreshToken,
  v: payloadVersion,
});

const getCookieOptions = (
  authCookie: AuthCookieConfig,
  origin: OriginConfig,
) => ({
  domain: origin.host || undefined,
  path: cookiePath,
  httpOnly: true,
  secure: true,
  sameSite: "Lax" as const,
  maxAgeSeconds: authCookie.maxAgeHours * 60 * 60,
});

export const serializeRefreshCookie = (
  refreshToken: string,
  authCookie: AuthCookieConfig,
  origin: OriginConfig,
  protection: CookieProtectionConfig,
): string => {
  const payload = JSON.stringify(buildCookiePayload(refreshToken));
  const encrypted = encrypt(payload, protection.secretKey);
  return serializeCookie(authCookie.name, encrypted, {
    ...getCookieOptions(authCookie, origin),
  });
};

export const serializeDeleteRefreshCookie = (
  authCookie: AuthCookieConfig,
  origin: OriginConfig,
): string => {
  return serializeCookie(authCookie.name, "", {
    domain: origin.host || undefined,
    path: cookiePath,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAgeSeconds: 0,
  });
};

export const readRefreshTokenFromRequest = (
  req: Pick<Request, "headers">,
  authCookie: AuthCookieConfig,
  protection: CookieProtectionConfig,
): string | null => {
  const header = req.headers.cookie;
  if (!header) {
    return null;
  }
  const cookies = parseCookieHeader(header);
  const value = cookies[authCookie.name];
  if (!value) {
    return null;
  }
  const decrypted = decrypt(value, protection.secretKey);
  if (!decrypted) {
    return null;
  }
  try {
    const payload = JSON.parse(decrypted) as RefreshCookiePayload;
    if (!payload || payload.v !== payloadVersion || !payload.rt) {
      return null;
    }
    return payload.rt;
  } catch {
    return null;
  }
};
