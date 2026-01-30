import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { config } from "../config";

export type AuthenticatedRequest = Request & {
  auth?: JwtPayload & { sub?: string };
};

export const requireJwt = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    res.sendStatus(401);
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    res.sendStatus(401);
    return;
  }

  const rawKey = config.jwt.key?.trim();
  if (!rawKey) {
    res.sendStatus(500);
    return;
  }
  const key = Buffer.from(rawKey, "base64");
  const normalizedKey = rawKey.replace(/=+$/g, "");
  const normalizedBase64 = key.toString("base64").replace(/=+$/g, "");
  if (key.length === 0 || normalizedBase64 !== normalizedKey) {
    res.sendStatus(500);
    return;
  }

  try {
    const payload = jwt.verify(token, key, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    req.auth =
      typeof payload === "string" ? ({ sub: payload } as JwtPayload) : payload;
    next();
  } catch(ex) {
    res.sendStatus(401);
  }
};
