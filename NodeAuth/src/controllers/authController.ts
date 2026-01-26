import { Router, type Request, type Response } from "express";

import type { AppConfig } from "../config";
import { JwtTokenService } from "../services/JwtTokenService";
import {
  readRefreshTokenFromRequest,
  serializeRefreshCookie,
} from "../utils/cookieProtector";
import { validateOrigin } from "../utils/originValidator";

type AuthControllerDeps = {
  jwtTokenService: JwtTokenService;
  config: AppConfig;
};

export const buildAuthRouter = ({
  jwtTokenService,
  config,
}: AuthControllerDeps): Router => {
  const router = Router();

  router.post(
    "/web-refresh",
    async (req: Request, res: Response): Promise<void> => {
      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      const refreshToken = readRefreshTokenFromRequest(
        req,
        config.authCookie,
        config.cookieProtection,
      );
      if (!refreshToken) {
        res.sendStatus(401);
        return;
      }

      const pair = await jwtTokenService.refreshTokensAsync(refreshToken);
      if (!pair) {
        res.sendStatus(401);
        return;
      }

      const setCookie = serializeRefreshCookie(
        pair.refreshToken,
        config.authCookie,
        config.origin,
        config.cookieProtection,
      );
      res.setHeader("Set-Cookie", setCookie);
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({
        accessToken: pair.accessToken,
        expiresIn: pair.expiresIn,
      });
    },
  );

  return router;
};
