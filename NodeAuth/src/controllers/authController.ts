import { Router, type Request, type Response } from "express";

import type { AppConfig } from "../config";
import { JwtTokenService } from "../services/JwtTokenService";
import { LoginService } from "../services/LoginService";
import {
  readRefreshTokenFromRequest,
  serializeRefreshCookie,
} from "../utils/cookieProtector";
import { validateOrigin } from "../utils/originValidator";
import type { WebLoginRequest } from "../models/WebLoginRequest";
import type { WebLoginResponse } from "../models/WebLoginResponse";

type AuthControllerDeps = {
  jwtTokenService: JwtTokenService;
  loginService: LoginService;
  config: AppConfig;
};

export const buildAuthRouter = ({
  jwtTokenService,
  loginService,
  config,
}: AuthControllerDeps): Router => {
  const router = Router();

  router.post(
    "/web-login",
    async (req: Request, res: Response): Promise<void> => {
      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      const body = req.body as WebLoginRequest;
      if (!body.username || !body.password) {
        res.sendStatus(400);
        return;
      }

      const user = await loginService.loginAsync({
        username: body.username,
        password: body.password,
        lockEnabled: true,
      });

      if (!user) {
        res.sendStatus(401);
        return;
      }

      if (!user.emailConfirmed) {
        res.status(401).json({
          error: "EmailNotConfirmed",
          error_description: "Email address is not confirmed.",
        });
        return;
      }

      const token = await jwtTokenService.issueTokenAsync(user);

      const setCookie = serializeRefreshCookie(
        token.refreshToken,
        config.authCookie,
        config.origin,
        config.cookieProtection,
      );
      res.setHeader("Set-Cookie", setCookie);
      res.setHeader("Cache-Control", "no-store");

      const response: WebLoginResponse = {
        accessToken: token.accessToken,
        expiresIn: token.expiresIn,
      };
      res.status(200).json(response);
    },
  );

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
