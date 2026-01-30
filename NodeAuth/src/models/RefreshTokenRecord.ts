export interface RefreshTokenRecord {
  token: string;
  userId: string;
  sessionCreatedAt: Date;
  expiresAt: Date;
  index: number;
}
