export interface JwtConfig {
  key: string;
  issuer: string;
  audience: string;
  expiresInSeconds: number;
}
