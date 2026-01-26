import { randomUUID } from "crypto";

import { ResetPasswordEmailSettings } from "../../config/email";
import { SentEmail, SentEmailType } from "../../models/SentEmail";
import { User } from "../../models/User";
import { ISentEmailsRepo } from "../../repos/interfaces/ISentEmailsRepo";
import { IEmailSender } from "../interfaces/IEmailSender";
import { IResetPasswordEmailService } from "../interfaces/IResetPasswordEmailService";

export class InMemoryResetPasswordEmailService implements IResetPasswordEmailService {
  constructor(
    private readonly sentEmailsRepo: ISentEmailsRepo,
    private readonly emailSender: IEmailSender,
    private readonly settings: ResetPasswordEmailSettings,
  ) {}

  async sendResetPasswordEmailAsync(
    user: User,
    email: string,
    resetPasswordUrl: string,
  ): Promise<boolean> {
    const sentToday = await this.sentEmailsRepo.getSentEmailsForDateAsync(
      user.id,
      SentEmailType.ResetPassword,
      new Date(),
    );

    if (sentToday.length >= this.settings.maxEmailsPerDay) {
      return false;
    }

    await this.emailSender.sendEmailAsync(
      email,
      this.settings.from,
      this.settings.subject,
      `Reset your password: ${resetPasswordUrl}`,
    );

    const sentEmail: SentEmail = {
      id: randomUUID(),
      userId: user.id,
      emailType: SentEmailType.ResetPassword,
      sentAt: new Date(),
    };
    await this.sentEmailsRepo.insertAsync(sentEmail);
    return true;
  }
}
