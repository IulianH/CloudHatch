import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import {
  Strategy as OpenIdConnectStrategy,
  type Profile as OpenIdConnectProfile,
  type VerifyCallback,
} from "@govtechsg/passport-openidconnect";

import { buildAuthRouter } from "./controllers/authController";
import { config } from "./config";
import { FederatedUser } from "./models/FederatedUser";
import { buildAppleClientSecret } from "./utils/appleClientSecret";
import { IRefreshTokenRepository } from "./repos/interfaces/IRefreshTokenRepository";
import { ISentEmailsRepo } from "./repos/interfaces/ISentEmailsRepo";
import { IUserRepo } from "./repos/interfaces/IUserRepo";
import { PostgresRefreshTokenRepository } from "./repos/postgres/PostgresRefreshTokenRepository";
import { PostgresSentEmailsRepo } from "./repos/postgres/PostgresSentEmailsRepo";
import { PostgresUserRepo } from "./repos/postgres/PostgresUserRepo";
import { getPgPool } from "./repos/postgres/db";
import { migratePostgresSchemaAsync } from "./repos/postgres/migrate";
import { JwtTokenService } from "./services/JwtTokenService";
import { RefreshTokenService } from "./services/RefreshTokenService";
import { LoginService } from "./services/LoginService";
import { RegistrationService } from "./services/RegistrationService";
import { InMemoryEmailSender } from "./services/inMemory/InMemoryEmailSender";
import { InMemoryRegistrationEmailService } from "./services/inMemory/InMemoryRegistrationEmailService";

const app = express();
app.use(express.json());
app.set("trust proxy", 1);

// The service owns its response headers so behavior is identical with or
// without the nginx front end (which is absent on serverless deploys).
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Strict-Transport-Security", "max-age=31536000");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

const userRepo: IUserRepo = new PostgresUserRepo();
const refreshTokenRepo: IRefreshTokenRepository =
  new PostgresRefreshTokenRepository();
const sentEmailsRepo: ISentEmailsRepo = new PostgresSentEmailsRepo();

const refreshTokenService = new RefreshTokenService(
  refreshTokenRepo,
  config.refreshToken,
);
const jwtTokenService = new JwtTokenService(
  config.jwt,
  refreshTokenService,
  userRepo,
);
const loginService = new LoginService(userRepo, config.login);
const emailSender = new InMemoryEmailSender();
const registrationEmailService = new InMemoryRegistrationEmailService(
  sentEmailsRepo,
  emailSender,
  config.registrationEmail,
);
const registrationService = new RegistrationService(
  userRepo,
  registrationEmailService,
  config.register,
);

const sessionSecret = config.cookieProtection.secretKey.toString("base64");
const PostgresSessionStore = connectPgSimple(session);
const sessionStore = new PostgresSessionStore({
  pool: getPgPool(),
  createTableIfMissing: false,
  // Sessions only bridge the OAuth handshake; one hour is plenty.
  ttl: 60 * 60,
  // No background timers: the process is short-lived on serverless.
  pruneSessionInterval: false,
});

app.use(
  session({
    name: "__Host.external",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    },
  }),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: FederatedUser, done) => {
  done(null, user);
});

if (config.googleOAuth.enabled) {
  if (!config.googleOAuth.clientId || !config.googleOAuth.clientSecret) {
    throw new Error("Google OAuth credentials are missing.");
  }

  const callbackUrl = new URL(
    config.googleOAuth.callbackPath,
    config.origin.baseUrl,
  ).toString();

  passport.use(
    "google",
    new OpenIdConnectStrategy(
      {
        issuer: "https://accounts.google.com",
        authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenURL: "https://oauth2.googleapis.com/token",
        userInfoURL: "https://openidconnect.googleapis.com/v1/userinfo",
        clientID: config.googleOAuth.clientId,
        clientSecret: config.googleOAuth.clientSecret,
        callbackURL: callbackUrl,
        scope: ["openid", "email", "profile"],
        pkce: "S256",
        nonce: true,
      },
      async (
        issuer: string,
        profile: OpenIdConnectProfile,
        done: VerifyCallback,
      ) => {
        try {
          if (!profile?.id) {
            return done(new Error("Missing external id from provider."));
          }
          const email = profile.emails?.[0]?.value;
          const user: FederatedUser = {
            id: profile.id,
            issuer,
            name: profile.displayName ?? undefined,
            email,
            username: profile.username ?? email ?? undefined,
          };
          await registrationService.registerFederatedAsync(user);
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
}

if (config.microsoftOAuth.enabled) {
  if (!config.microsoftOAuth.clientId || !config.microsoftOAuth.clientSecret) {
    throw new Error("Microsoft OAuth credentials are missing.");
  }

  const callbackUrl = new URL(
    config.microsoftOAuth.callbackPath,
    config.origin.baseUrl,
  ).toString();
  const tenantSegment = config.microsoftOAuth.tenantId || "common";
  const issuerTenantId =
    tenantSegment === "consumers"
      ? "9188040d-6c67-4c5b-b112-36a304b66dad"
      : tenantSegment;

  passport.use(
    "microsoft",
    new OpenIdConnectStrategy(
      {
        issuer: `https://login.microsoftonline.com/${issuerTenantId}/v2.0`,
        authorizationURL: `https://login.microsoftonline.com/${tenantSegment}/oauth2/v2.0/authorize`,
        tokenURL: `https://login.microsoftonline.com/${tenantSegment}/oauth2/v2.0/token`,
        userInfoURL: "https://graph.microsoft.com/oidc/userinfo",
        clientID: config.microsoftOAuth.clientId,
        clientSecret: config.microsoftOAuth.clientSecret,
        callbackURL: callbackUrl,
        scope: ["openid", "email", "profile"],
        pkce: "S256",
        nonce: true,
      },
      async (
        issuer: string,
        profile: OpenIdConnectProfile,
        done: VerifyCallback,
      ) => {
        try {
          if (!profile?.id) {
            return done(new Error("Missing external id from provider."));
          }
          const microsoftProfile = profile as OpenIdConnectProfile & {
            _json?: { email?: string; preferred_username?: string };
          };
          const email =
            profile.emails?.[0]?.value ??
            microsoftProfile._json?.email ??
            microsoftProfile._json?.preferred_username;
          const user: FederatedUser = {
            id: profile.id,
            issuer,
            name: profile.displayName ?? undefined,
            email,
            username:
              profile.username ??
              email ??
              microsoftProfile._json?.preferred_username ??
              undefined,
          };
          await registrationService.registerFederatedAsync(user);
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
}

if (config.appleOAuth.enabled) {
  const apple = config.appleOAuth;
  if (
    !apple.clientId ||
    !apple.teamId ||
    !apple.keyId ||
    !apple.privateKey
  ) {
    throw new Error("Apple OAuth credentials are missing.");
  }

  const callbackUrl = new URL(
    apple.callbackPath,
    config.origin.baseUrl,
  ).toString();

  passport.use(
    "apple",
    new OpenIdConnectStrategy(
      {
        issuer: "https://appleid.apple.com",
        authorizationURL: "https://appleid.apple.com/auth/authorize",
        tokenURL: "https://appleid.apple.com/auth/token",
        clientID: apple.clientId,
        // Apple's client secret is a JWT minted from the Sign in with Apple
        // key, not a static string.
        clientSecret: buildAppleClientSecret(apple),
        callbackURL: callbackUrl,
        // The strategy appends "openid" to the requested scopes.
        scope: ["name", "email"],
        // Apple rejects query responses once name/email scopes are
        // requested; form_post is mandatory.
        responseMode: "form_post",
        nonce: true,
        // Apple exposes no userinfo endpoint; the profile is built from
        // the id_token claims. The placeholder is never fetched because
        // skipUserProfile is set; it 404s loudly if that ever changes.
        userInfoURL: "https://appleid.apple.com/auth/userinfo",
        skipUserProfile: true,
      },
      async (
        issuer: string,
        profile: OpenIdConnectProfile,
        done: VerifyCallback,
      ) => {
        try {
          if (!profile?.id) {
            return done(new Error("Missing external id from provider."));
          }
          const email = profile.emails?.[0]?.value;
          const user: FederatedUser = {
            id: profile.id,
            issuer,
            name: profile.displayName ?? undefined,
            email,
            username: profile.username ?? email ?? undefined,
          };
          await registrationService.registerFederatedAsync(user);
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
}

app.use(passport.initialize());
app.use(passport.session());

const corsAllowedOrigin = config.origin.allowedOrigin;
if (corsAllowedOrigin) {
  app.use("/api/auth", (req, res, next) => {
    res.setHeader("Vary", "Origin");
    if (req.headers.origin !== corsAllowedOrigin) {
      next();
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", corsAllowedOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Cache-Control",
      );
      res.setHeader("Access-Control-Max-Age", "86400");
      res.sendStatus(204);
      return;
    }
    next();
  });
}

app.use(
  "/api/auth",
  buildAuthRouter({
    jwtTokenService,
    loginService,
    config,
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const startServerAsync = async (): Promise<void> => {
  await migratePostgresSchemaAsync();

  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => {
    console.log(`NodeAuth listening on port ${port}`);
  });
};

// Vercel sets VERCEL in serverless invocations: serve through the default
// export instead of binding a port, and skip migrations (run them in the
// deploy step to avoid concurrent DDL races).
if (!process.env.VERCEL) {
  void startServerAsync();
}

export default app;
