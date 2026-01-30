import { randomBytes } from "crypto";

import { ResetPasswordSettings } from "../config/resetPassword";
import { IUserRepo } from "../repos/interfaces/IUserRepo";
import { isLocalAccount } from "../utils/constants";
import { PasswordHasher } from "../utils/passwordHasher";
import { IResetPasswordEmailService } from "./interfaces/IResetPasswordEmailService";

export class ResetPasswordService {
  constructor(
    private readonly repo: IUserRepo,
    private readonly emailService: IResetPasswordEmailService,
    private readonly settings: ResetPasswordSettings,
  ) {}

  async sendResetPasswordEmail(email: string): Promise<boolean> {
    const existingUser = await this.repo.findByEmailAsync(email);
    if (
      !existingUser ||
      !existingUser.emailConfirmed ||
      !isLocalAccount(existingUser.issuer)
    ) {
      return false;
    }

    const resetToken = this.generateResetPasswordToken();
    const resetUrl = `${this.settings.resetPasswordUrl}?token=${encodeURIComponent(
      resetToken,
    )}`;

    const sent = await this.emailService.sendResetPasswordEmailAsync(
      existingUser,
      email,
      resetUrl,
    );
    if (!sent) {
      return false;
    }

    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordTokenExpiresAt = this.addMinutes(
      new Date(),
      this.settings.resetPasswordTokenExpiresInMinutes,
    );
    await this.repo.updateAsync(existingUser);
    return true;
  }

  async resetPasswordAsync(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResult> {
    if (!token?.trim()) {
      return {
        success: false,
        error: "InvalidToken",
        errorDescription: "Token is required.",
      };
    }

    const user = await this.repo.findByResetPasswordTokenAsync(token);
    if (!user || !isLocalAccount(user.issuer)) {
      return {
        success: false,
        error: "InvalidToken",
        errorDescription: "Invalid reset token.",
      };
    }

    if (
      !user.resetPasswordTokenExpiresAt ||
      Date.now() > user.resetPasswordTokenExpiresAt.getTime()
    ) {
      return {
        success: false,
        error: "TokenExpired",
        errorDescription: "Reset token has expired.",
      };
    }

    user.password = PasswordHasher.hash(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    await this.repo.updateAsync(user);

    return { success: true };
  }

  private generateResetPasswordToken(): string {
    return randomBytes(32).toString("base64");
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
  errorDescription?: string;
}
