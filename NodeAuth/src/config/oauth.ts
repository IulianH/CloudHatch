export interface GoogleOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
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
};

export const defaultMicrosoftOAuthConfig: MicrosoftOAuthConfig = {
  enabled: false,
  clientId: "",
  clientSecret: "",
};
