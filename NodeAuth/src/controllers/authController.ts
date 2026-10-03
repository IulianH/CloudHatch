import express, { Router, type NextFunction, type Request, type Response } from "express";
import passport from "passport";

import type { AppConfig } from "../config";
import { JwtTokenService } from "../services/JwtTokenService";
import { LoginService } from "../services/LoginService";
import type { FederatedUser } from "../models/FederatedUser";
import {
  readRefreshTokenFromRequest,
  serializeRefreshCookie,
  serializeDeleteRefreshCookie,
} from "../utils/cookieProtector";
import type { WebLogoutRequest } from "../models/WebLogoutRequest";

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
  const buildFederationSuccessUrl = (returnUrl?: string): string => {
    const url = new URL(
      config.origin.federationSuccessPath,
      config.origin.baseUrl,
    );
    if (returnUrl) {
      url.searchParams.set("returnUrl", returnUrl);
    }
    return url.toString();
  };
  const federationSuccessUrl = buildFederationSuccessUrl();

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

  router.get(
    "/web-google-challenge",
    (req: Request, res: Response, next: NextFunction): void => {
      if (!config.googleOAuth.enabled) {
        res.sendStatus(404);
        return;
      }
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
          res.redirect(federationSuccessUrl);
        });
      })(req, res, next);
    },
  );

  router.get(
    "/web-microsoft-challenge",
    (req: Request, res: Response, next: NextFunction): void => {
      if (!config.microsoftOAuth.enabled) {
        res.sendStatus(404);
        return;
      }

      const returnUrl =
        typeof req.query.returnUrl === "string" ? req.query.returnUrl : undefined;
      if (req.session) {
        req.session.microsoftReturnUrl = returnUrl;
      }
      passport.authenticate("microsoft")(req, res, next);
    },
  );

  router.get(
    "/web-microsoft-callback",
    (req: Request, res: Response, next: NextFunction): void => {
      if (!config.microsoftOAuth.enabled) {
        res.sendStatus(404);
        return;
      }

      passport.authenticate(
        "microsoft",
        (error: unknown, user?: FederatedUser, info?: { message?: string }) => {
          if (error || !user) {
            console.error("WebMicrosoftCallback failed", error ?? info);
            res.sendStatus(401);
            return;
          }

          req.logIn(user, (loginError) => {
            if (loginError) {
              console.error("WebMicrosoftCallback sign-in failed", loginError);
              res.sendStatus(500);
              return;
            }
            const returnUrl = req.session?.microsoftReturnUrl;
            if (req.session) {
              delete req.session.microsoftReturnUrl;
            }
            res.redirect(buildFederationSuccessUrl(returnUrl));
          });
        },
      )(req, res, next);
    },
  );

  router.get(
    "/web-apple-challenge",
    (req: Request, res: Response, next: NextFunction): void => {
      if (!config.appleOAuth.enabled) {
        res.sendStatus(404);
        return;
      }

      passport.authenticate("apple")(req, res, next);
    },
  );

  // Apple delivers the code as a top-level cross-site form POST
  // (response_mode=form_post). SameSite=Lax session cookies are not
  // reliably attached to such requests, so the parameters are relayed
  // to a same-site GET that carries the session before the strategy
  // validates its state.
  router.post(
    "/web-apple-callback",
    express.urlencoded({ extended: false }),
    (req: Request, res: Response): void => {
      if (!config.appleOAuth.enabled) {
        res.sendStatus(404);
        return;
      }

      const body = req.body as Record<string, string | undefined>;
      const params = new URLSearchParams();
      for (const key of ["code", "state", "error", "error_description"]) {
        const value = body[key];
        if (typeof value === "string" && value.length > 0) {
          params.set(key, value);
        }
      }
      res.redirect(303, `${config.appleOAuth.callbackPath}?${params.toString()}`);
    },
  );

  router.get(
    "/web-apple-callback",
    (req: Request, res: Response, next: NextFunction): void => {
      if (!config.appleOAuth.enabled) {
        res.sendStatus(404);
        return;
      }

      passport.authenticate("apple", (error: unknown, user?: FederatedUser) => {
        if (error || !user) {
          console.error("WebAppleCallback failed", error);
          res.sendStatus(401);
          return;
        }

        req.logIn(user, (loginError) => {
          if (loginError) {
            console.error("WebAppleCallback sign-in failed", loginError);
            res.sendStatus(500);
            return;
          }
          res.redirect(federationSuccessUrl);
        });
      })(req, res, next);
    },
  );


  router.post(
    "/web-federated-login",
    async (req: Request, res: Response): Promise<void> => {
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
      res.status(200).json({
        accessToken: token.accessToken,
        expiresIn: token.expiresIn,
      });
    },
  );

  router.post(
    "/web-refresh",
    async (req: Request, res: Response): Promise<void> => {
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
      res.status(200).json({
        accessToken: pair.accessToken,
        expiresIn: pair.expiresIn,
      });
    },
  );

  router.post(
    "/web-logout",
    async (req: Request, res: Response): Promise<void> => {
      await clearFederatedSession(req);

      const body = req.body as WebLogoutRequest;
      const refreshToken = readRefreshTokenFromRequest(
        req,
        config.authCookie,
        config.cookieProtection,
      );

      if (refreshToken) {
        await jwtTokenService.revokeRefreshTokenAsync(
          refreshToken,
          body.logoutAll,
        );
      }

      const deleteCookie = serializeDeleteRefreshCookie(
        config.authCookie,
        config.origin,
      );
      res.setHeader("Set-Cookie", deleteCookie);
      res.sendStatus(204);
    },
  );

  return router;
};
