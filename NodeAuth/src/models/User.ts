export interface User {
  id: string;
  username?: string;
  email?: string;
  name?: string;
  createdAt: Date;
  lastLogin?: Date;
  isLocked: boolean;
  roles?: string;
  externalId?: string;
  issuer: string;
}
