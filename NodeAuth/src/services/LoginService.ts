import { User } from "../models/User";
import { IUserRepo } from "../repos/interfaces/IUserRepo";

export class LoginService {
  constructor(private readonly repo: IUserRepo) {}

  async loginFederatedAsync(
    externalId: string,
    lockEnabled: boolean,
  ): Promise<User | null> {
    const user = await this.repo.findByExternalIdAsync(externalId);
    if (!user) {
      console.warn("Login failed: user wasn't found", { externalId });
      return null;
    }

    if(lockEnabled && user.isLocked){
      console.warn("Login failed: user is locked!", { externalId });
      return null;
    }
    user.lastLogin = new Date();
    await this.repo.updateAsync(user);
    return user;
  }
}
