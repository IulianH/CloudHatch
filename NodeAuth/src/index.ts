import express from "express";
import session from "express-session";
import passport from "passport";
import {
  Strategy as OpenIdConnectStrategy,
  type Profile as OpenIdConnectProfile,
  type VerifyCallback,
} from "passport-openidconnect";

import { buildAuthRouter } from "./controllers/authController";
import { buildRegisterRouter } from "./controllers/registerController";
import { buildResetPasswordRouter } from "./controllers/resetPasswordController";
import { config } from "./config";
import { FederatedUser } from "./models/FederatedUser";
import { InMemoryRefreshTokenRepository } from "./repos/inMemory/InMemoryRefreshTokenRepository";
import { InMemorySentEmailsRepo } from "./repos/inMemory/InMemorySentEmailsRepo";
import { InMemoryUserRepo } from "./repos/inMemory/InMemoryUserRepo";
import { JwtTokenService } from "./services/JwtTokenService";
import { RefreshTokenService } from "./services/RefreshTokenService";
import { LoginService } from "./services/LoginService";
import { RegistrationService } from "./services/RegistrationService";
import { InMemoryEmailSender } from "./services/inMemory/InMemoryEmailSender";
import { InMemoryRegistrationEmailService } from "./services/inMemory/InMemoryRegistrationEmailService";
import { InMemoryResetPasswordEmailService } from "./services/inMemory/InMemoryResetPasswordEmailService";
import { ResetPasswordService } from "./services/ResetPasswordService";

const app = express();
app.use(express.json());
app.set("trust proxy", 1);

const userRepo = new InMemoryUserRepo();
userRepo.migrate();
const refreshTokenRepo = new InMemoryRefreshTokenRepository();
refreshTokenRepo.migrate();
const sentEmailsRepo = new InMemorySentEmailsRepo();

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
const resetPasswordEmailService = new InMemoryResetPasswordEmailService(
  sentEmailsRepo,
  emailSender,
  config.resetPasswordEmail,
);
const resetPasswordService = new ResetPasswordService(
  userRepo,
  resetPasswordEmailService,
  config.resetPassword,
);

const sessionSecret = config.cookieProtection.secretKey.toString("base64");
app.use(
  session({
    name: "__Host.external",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "none",
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

app.use(passport.initialize());
app.use(passport.session());

app.use(
  "/api/auth",
  buildAuthRouter({
    jwtTokenService,
    loginService,
    config,
  }),
);

app.use(
  "/api/auth",
  buildRegisterRouter({
    registrationService,
    config,
  }),
);

app.use(
  "/api/auth",
  buildResetPasswordRouter({
    resetPasswordService,
    config,
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`NodeAuth listening on port ${port}`);
});
