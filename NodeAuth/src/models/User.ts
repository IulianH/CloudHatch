export interface User {
  id: string;
  username?: string;
  email?: string;
  name?: string;
  password?: string;
  createdAt: Date;
  lockedUntil?: Date;
  lastLogin?: Date;
  isLocked: boolean;
  roles?: string;
  externalId?: string;
  issuer: string;
  failedLoginCount: number;
  emailConfirmed: boolean;
  emailConfirmationToken?: string;
  emailConfirmationTokenExpiresAt?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiresAt?: Date;
}
