export const localAccountIssuer = "local";

export const isLocalAccount = (issuer: string): boolean =>
  issuer.toLowerCase() === localAccountIssuer;
