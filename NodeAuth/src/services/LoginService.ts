import { User } from "../models/User";
import { IUserRepo } from "../repos/interfaces/IUserRepo";

export class LoginService {
  constructor(private readonly repo: IUserRepo) {}

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
