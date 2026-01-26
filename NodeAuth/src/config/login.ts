export interface LoginSettings {
  maxFailedPasswordLoginAttempts: number;
  accountLockDurationInMinutes: number;
  lockoutStartsAfterAttempts: number;
}
