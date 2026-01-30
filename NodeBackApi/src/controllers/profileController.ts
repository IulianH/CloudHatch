import { Router, type Request, type Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

import { requireJwt } from "../middleware/jwtAuth";

const getClaim = (claims: JwtPayload | undefined, key: string): string | undefined => {
  const value = claims?.[key];
  return typeof value === "string" ? value : undefined;
};

export const buildProfileRouter = (): Router => {
  const router = Router();

  router.get(
    "/profile",
    requireJwt,
    (req: Request, res: Response): void => {
      const claims = req.auth;
      const name =
        getClaim(claims, "name") ??
        getClaim(claims, "email") ??
        getClaim(claims, "preferred_username") ??
        "External User";
      const idp = getClaim(claims, "idp") ?? "local";
      res.status(200).json({ name, idp });
    },
  );

  return router;
};
