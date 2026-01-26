import { Router, type NextFunction, type Request, type Response } from "express";
import passport from "passport";

import type { AppConfig } from "../config";
import { JwtTokenService } from "../services/JwtTokenService";
import { LoginService } from "../services/LoginService";
import type { FederatedUser } from "../models/FederatedUser";
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
  const federationSuccessUrl = new URL(
    config.origin.federationSuccessPath,
    config.origin.baseUrl,
  ).toString();

  const clearFederatedSession = async (req: Request): Promise<void> => {
    if (typeof req.logout === "function") {
      await new Promise<void>((resolve, reject) => {
        req.logout((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    if (req.session) {
      await new Promise<void>((resolve) => {
        req.session?.destroy(() => resolve());
      });
    }
  };

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
      await clearFederatedSession(req);

      const response: WebLoginResponse = {
        accessToken: token.accessToken,
        expiresIn: token.expiresIn,
      };
      res.status(200).json(response);
    },
  );

  router.get(
    "/web-google-challenge",
    (req: Request, res: Response, next: NextFunction): void => {
      if (!config.googleOAuth.enabled) {
        res.sendStatus(404);
        return;
      }

      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      res.setHeader("Cache-Control", "no-store");
      passport.authenticate("google")(req, res, next);
    },
  );

  router.get(
    "/web-google-callback",
    (req: Request, res: Response, next: NextFunction): void => {
      if (!config.googleOAuth.enabled) {
        res.sendStatus(404);
        return;
      }

      passport.authenticate("google", (error: unknown, user?: FederatedUser) => {
        if (error || !user) {
          console.error("WebGoogleCallback failed", error);
          res.sendStatus(401);
          return;
        }

        req.logIn(user, (loginError) => {
          if (loginError) {
            console.error("WebGoogleCallback sign-in failed", loginError);
            res.sendStatus(500);
            return;
          }
          res.setHeader("Cache-Control", "no-store");
          res.redirect(federationSuccessUrl);
        });
      })(req, res, next);
    },
  );

  router.post(
    "/web-federated-login",
    async (req: Request, res: Response): Promise<void> => {
      const originResult = validateOrigin(req, config.origin.host);
      if (!originResult.allowed) {
        console.warn(originResult.error);
        res.sendStatus(403);
        return;
      }

      const federatedUser = req.user as FederatedUser | undefined;
      if (!federatedUser?.id) {
        console.error(
          "WebLoginFederated: missing federated identity or external id",
        );
        res.sendStatus(401);
        return;
      }

      await clearFederatedSession(req);

      const user = await loginService.loginFederatedAsync(
        federatedUser.id,
        true,
      );
      if (!user) {
        res.sendStatus(401);
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
      res.status(200).json({
        accessToken: token.accessToken,
        expiresIn: token.expiresIn,
      });
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
