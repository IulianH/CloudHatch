import { randomBytes, randomUUID } from "crypto";

import { RegisterSettings } from "../config/register";
import { FederatedUser } from "../models/FederatedUser";
import { User } from "../models/User";
import { IUserRepo } from "../repos/interfaces/IUserRepo";
import { PasswordHasher } from "../utils/passwordHasher";
import { IRegistrationEmailService } from "./interfaces/IRegistrationEmailService";

export class RegistrationService {
  constructor(
    private readonly repo: IUserRepo,
    private readonly emailService: IRegistrationEmailService,
    private readonly settings: RegisterSettings,
  ) {}

  async registerFederatedAsync(fedUser: FederatedUser): Promise<boolean> {
    let user = await this.repo.findByExternalIdAsync(fedUser.id);
    if (!user) {
      user = {
        id: randomUUID(),
        externalId: fedUser.id,
        issuer: fedUser.issuer,
        email: fedUser.email,
        username: fedUser.username ?? fedUser.email,
        name: fedUser.name,
        createdAt: new Date(),
        roles: "customer",
        emailConfirmed: true,
        isLocked: false,
        failedLoginCount: 0,
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

  async registerAsync(email: string, password: string): Promise<RegistrationResult> {
    const existingUser = await this.repo.findByEmailAsync(email);
    if (existingUser && existingUser.emailConfirmed) {
      return { success: true };
    }

    if (existingUser && !existingUser.emailConfirmed) {
      existingUser.password = PasswordHasher.hash(password);
      const token = this.generateConfirmationToken();
      existingUser.emailConfirmationToken = token;
      existingUser.emailConfirmationTokenExpiresAt = this.addHours(
        new Date(),
        this.settings.emailConfirmationTokenExpiresInHours,
      );
      await this.repo.updateAsync(existingUser);
      const confirmUrl = `${this.settings.emailConfirmUrl}?token=${encodeURIComponent(
        token,
      )}`;
      await this.emailService.sendRegistrationEmailAsync(
        existingUser,
        email,
        confirmUrl,
      );
      return { success: true };
    }

    const confirmationToken = this.generateConfirmationToken();
    const newUser: User = {
      id: randomUUID(),
      email,
      username: email,
      password: PasswordHasher.hash(password),
      emailConfirmed: false,
      emailConfirmationToken: confirmationToken,
      emailConfirmationTokenExpiresAt: this.addHours(
        new Date(),
        this.settings.emailConfirmationTokenExpiresInHours,
      ),
      issuer: "local",
      createdAt: new Date(),
      roles: "customer",
      isLocked: false,
      failedLoginCount: 0,
    };

    await this.repo.insertAsync(newUser);

    const url = `${this.settings.emailConfirmUrl}?token=${encodeURIComponent(
      confirmationToken,
    )}`;
    await this.emailService.sendRegistrationEmailAsync(newUser, email, url);

    return { success: true };
  }

  async resendRegistrationEmail(email: string): Promise<boolean> {
    const existingUser = await this.repo.findByEmailAsync(email);
    if (!existingUser || existingUser.emailConfirmed) {
      return false;
    }

    const confirmationToken = this.generateConfirmationToken();
    const confirmUrl = `${this.settings.emailConfirmUrl}?token=${encodeURIComponent(
      confirmationToken,
    )}`;
    const sent = await this.emailService.sendRegistrationEmailAsync(
      existingUser,
      email,
      confirmUrl,
    );
    if (!sent) {
      return false;
    }

    existingUser.emailConfirmationToken = confirmationToken;
    existingUser.emailConfirmationTokenExpiresAt = this.addHours(
      new Date(),
      this.settings.emailConfirmationTokenExpiresInHours,
    );
    await this.repo.updateAsync(existingUser);
    return true;
  }

  async confirmEmailAsync(token: string): Promise<EmailConfirmationResult> {
    if (!token?.trim()) {
      return {
        success: false,
        error: "InvalidToken",
        errorDescription: "Token is required.",
      };
    }

    const user = await this.repo.findByConfirmationTokenAsync(token);
    if (!user) {
      return {
        success: false,
        error: "InvalidToken",
        errorDescription: "Invalid confirmation token.",
      };
    }

    if (user.emailConfirmed) {
      return {
        success: false,
        error: "AlreadyConfirmed",
        errorDescription: "Email has already been confirmed.",
      };
    }

    if (
      !user.emailConfirmationTokenExpiresAt ||
      Date.now() > user.emailConfirmationTokenExpiresAt.getTime()
    ) {
      return {
        success: false,
        error: "TokenExpired",
        errorDescription: "Confirmation token has expired.",
      };
    }

    user.emailConfirmed = true;
    user.emailConfirmationToken = undefined;
    user.emailConfirmationTokenExpiresAt = undefined;
    await this.repo.updateAsync(user);

    return { success: true };
  }

  private generateConfirmationToken(): string {
    return randomBytes(32).toString("base64");
  }

  private addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }
}

export interface RegistrationResult {
  success: boolean;
  error?: string;
  errorDescription?: string;
}

export interface EmailConfirmationResult {
  success: boolean;
  error?: string;
  errorDescription?: string;
}
