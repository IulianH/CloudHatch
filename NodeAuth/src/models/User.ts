export interface User {
  id: string;
  username?: string;
  email?: string;
  name?: string;
  createdAt: Date;
  lockedUntil?: Date;
  lastLogin?: Date;
  isLocked: boolean;
  roles?: string;
  externalId?: string;
  issuer: string;
  failedLoginCount: number;
}
