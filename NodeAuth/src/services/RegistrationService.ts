import { randomUUID } from "crypto";

import { FederatedUser } from "../models/FederatedUser";
import { User } from "../models/User";
import { IUserRepo } from "../repos/interfaces/IUserRepo";

export class RegistrationService {
  constructor(private readonly repo: IUserRepo) {}

  async registerFederatedAsync(fedUser: FederatedUser): Promise<boolean> {
    let user = await this.repo.findByExternalIdAsync(fedUser.id);
    if (!user) {
      if (fedUser.email) {
        const existing = await this.repo.findByEmailAsync(fedUser.email);
        if (existing) {
          existing.externalId = fedUser.id;
          existing.issuer = fedUser.issuer;
          existing.email = fedUser.email;
          existing.username = fedUser.username ?? existing.username ?? fedUser.email;
          existing.name = fedUser.name ?? existing.name;
          await this.repo.updateAsync(existing);
          return true;
        }
      }
      user = {
        id: randomUUID(),
        externalId: fedUser.id,
        issuer: fedUser.issuer,
        email: fedUser.email,
        username: fedUser.username ?? fedUser.email,
        name: fedUser.name,
        createdAt: new Date(),
        roles: "customer",
        isLocked: false,
      };
      await this.repo.insertAsync(user);
      return true;
    }

    user.issuer = fedUser.issuer;
    user.email = fedUser.email;
    user.username = fedUser.username ?? fedUser.email;
    user.name = fedUser.name;
    await this.repo.updateAsync(user);
    return true;
  }
}
