import type { Strategy as OpenIdConnectStrategy } from "@govtechsg/passport-openidconnect";

const MICROSOFT_ISSUER_PREFIX = "https://login.microsoftonline.com/";

type TokenResponse = { id_token?: string } & Record<string, unknown>;
type AccessTokenCallback = (
  err: unknown,
  accessToken?: unknown,
  refreshToken?: unknown,
  params?: TokenResponse,
) => void;

export const acceptMicrosoftTenantIssuers = (
  strategy: OpenIdConnectStrategy,
): void => {
  const internal = strategy as unknown as {
    _oauth2: {
      getOAuthAccessToken: (
        code: string,
        params: Record<string, unknown>,
        callback: AccessTokenCallback,
      ) => void;
    };
    _issuer: string;
  };
  const original = internal._oauth2.getOAuthAccessToken.bind(internal._oauth2);
  internal._oauth2.getOAuthAccessToken = (
    code: string,
    params: Record<string, unknown>,
    callback: AccessTokenCallback,
  ): void => {
    original(code, params, (err, accessToken, refreshToken, response) => {
      const idToken = response?.id_token;
      if (!err && typeof idToken === "string") {
        try {
          const payload = idToken.split(".")[1];
          const claims = JSON.parse(
            Buffer.from(payload, "base64").toString("utf8"),
          ) as { iss?: unknown };
          if (
            typeof claims.iss === "string" &&
            claims.iss.startsWith(MICROSOFT_ISSUER_PREFIX)
          ) {
            internal._issuer = claims.iss;
          }
        } catch {
        }
      }
      callback(err, accessToken, refreshToken, response);
    });
  };
};
