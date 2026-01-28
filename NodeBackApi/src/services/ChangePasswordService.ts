import { isLocalAccount } from "../utils/constants";
import { PasswordHasher } from "../utils/passwordHasher";
import type { IUserRepo } from "../repos/interfaces/IUserRepo";

export interface ChangePasswordRequest {
  userId: string;
  oldPassword: string;
  newPassword: string;
  lockEnabled: boolean;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
  errorDescription?: string;
}

export class ChangePasswordService {
  constructor(private readonly repo: IUserRepo) {}

  async changePasswordAsync(
    request: ChangePasswordRequest,
  ): Promise<ChangePasswordResult> {
    const user = await this.repo.findByIdAsync(request.userId);
    if (!user) {
      return {
        success: false,
        error: "UserNotFound",
        errorDescription: "User was not found.",
      };
    }

    if (request.lockEnabled) {
      if (
        user.isLocked ||
        (user.lockedUntil && Date.now() <= user.lockedUntil.getTime())
      ) {
        return {
          success: false,
          error: "AccountLocked",
          errorDescription: "Account is locked.",
        };
      }
    }

    if (!isLocalAccount(user.issuer)) {
      return {
        success: false,
        error: "InvalidAccountType",
        errorDescription: "Cannot change password for federated accounts.",
      };
    }

    if (!user.password || !PasswordHasher.verify(user.password, request.oldPassword)) {
      return {
        success: false,
        error: "InvalidOldPassword",
        errorDescription: "Old password is incorrect.",
      };
    }

    user.password = PasswordHasher.hash(request.newPassword);
    await this.repo.updateAsync(user);

    return { success: true };
  }
}
