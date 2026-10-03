export interface GoogleOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackPath: string;
}

export interface AppleOAuthConfig {
  enabled: boolean;
  /** Services ID registered with Apple for the web app. */
  clientId: string;
  teamId: string;
  keyId: string;
  /** Content of the Sign in with Apple .p8 private key. */
  privateKey: string;
  callbackPath: string;
}

export interface MicrosoftOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackPath: string;
  tenantId: string;
}

export const defaultGoogleOAuthConfig: GoogleOAuthConfig = {
  enabled: false,
  clientId: "",
  clientSecret: "",
  callbackPath: "/api/auth/web-google-callback",
};

export const defaultAppleOAuthConfig: AppleOAuthConfig = {
  enabled: false,
  clientId: "",
  teamId: "",
  keyId: "",
  privateKey: "",
  callbackPath: "/api/auth/web-apple-callback",
};

export const defaultMicrosoftOAuthConfig: MicrosoftOAuthConfig = {
  enabled: false,
  clientId: "",
  clientSecret: "",
  callbackPath: "/api/auth/web-microsoft-callback",
  tenantId: "common",
};
