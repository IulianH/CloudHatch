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

  try {
    const payload = jwt.verify(token, config.jwt.key, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    req.auth =
      typeof payload === "string" ? ({ sub: payload } as JwtPayload) : payload;
    next();
  } catch {
    res.sendStatus(401);
  }
};
