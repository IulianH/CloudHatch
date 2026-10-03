import jwt from "jsonwebtoken";

import type { AppleOAuthConfig } from "../config/oauth";

// Apple client secrets are short-lived ES256 JWTs bound to the team, key and
// Services ID. Apple caps the lifetime at 15777000 seconds; the secret is
// regenerated on every process start (and every serverless cold start), so
// the maximum lifetime also keeps long-lived local processes working.
export const buildAppleClientSecret = (
  config: AppleOAuthConfig,
): string =>
  jwt.sign({}, config.privateKey, {
    algorithm: "ES256",
    keyid: config.keyId,
    issuer: config.teamId,
    subject: config.clientId,
    audience: "https://appleid.apple.com",
    expiresIn: 15777000 - 60 * 60,
  });
