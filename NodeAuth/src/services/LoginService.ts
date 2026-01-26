import { LoginSettings } from "../config/login";
import { LoginRequest } from "../models/LoginRequest";
import { User } from "../models/User";
import { IUserRepo } from "../repos/interfaces/IUserRepo";

export class LoginService {
  constructor(
    private readonly repo: IUserRepo,
    private readonly settings: LoginSettings,
  ) {}

  async loginAsync(request: LoginRequest): Promise<User | null> {
    const user = await this.repo.findByUserNameAsync(request.username);
    if (!user || (request.lockEnabled && user.isLocked)) {
      return null;
    }

    if (request.lockEnabled && user.lockedUntil) {
      if (Date.now() <= user.lockedUntil.getTime()) {
        return null;
      }
    }

    if (!user.password) {
      return null;
    }

    if (user.password !== request.password) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= this.settings.maxFailedPasswordLoginAttempts) {
        user.isLocked = true;
      } else if (
        user.failedLoginCount === this.settings.lockoutStartsAfterAttempts
      ) {
        user.lockedUntil = new Date(
          Date.now() + this.settings.accountLockDurationInMinutes * 60 * 1000,
        );
      }
      await this.repo.updateAsync(user);
      return null;
    }

    if (!user.emailConfirmed) {
      return user;
    }

    user.lockedUntil = undefined;
    user.lastLogin = new Date();
    user.failedLoginCount = 0;
    await this.repo.updateAsync(user);
    return user;
  }

  async loginFederatedAsync(
    externalId: string,
    lockEnabled: boolean,
  ): Promise<User | null> {
    const user = await this.repo.findByExternalIdAsync(externalId);
    if (!user || (lockEnabled && user.isLocked)) {
      return null;
    }

    if (lockEnabled && user.lockedUntil) {
      if (Date.now() <= user.lockedUntil.getTime()) {
        return null;
      }
    }

    user.lastLogin = new Date();
    user.lockedUntil = undefined;
    user.failedLoginCount = 0;
    await this.repo.updateAsync(user);
    return user;
  }
}
