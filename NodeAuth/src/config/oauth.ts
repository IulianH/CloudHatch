export interface GoogleOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackPath: string;
}

export interface MicrosoftOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
}

export const defaultGoogleOAuthConfig: GoogleOAuthConfig = {
  enabled: false,
  clientId: "",
  clientSecret: "",
  callbackPath: "/api/auth/web-google-callback",
};

export const defaultMicrosoftOAuthConfig: MicrosoftOAuthConfig = {
  enabled: false,
  clientId: "",
  clientSecret: "",
};
