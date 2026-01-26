import { randomUUID } from "crypto";

import { RegistrationEmailSettings } from "../../config/email";
import { SentEmail, SentEmailType } from "../../models/SentEmail";
import { User } from "../../models/User";
import { ISentEmailsRepo } from "../../repos/interfaces/ISentEmailsRepo";
import { IEmailSender } from "../interfaces/IEmailSender";
import { IRegistrationEmailService } from "../interfaces/IRegistrationEmailService";

export class InMemoryRegistrationEmailService implements IRegistrationEmailService {
  constructor(
    private readonly sentEmailsRepo: ISentEmailsRepo,
    private readonly emailSender: IEmailSender,
    private readonly settings: RegistrationEmailSettings,
  ) {}

  async sendRegistrationEmailAsync(
    user: User,
    email: string,
    confirmationUrl: string,
  ): Promise<boolean> {
    const sentToday = await this.sentEmailsRepo.getSentEmailsForDateAsync(
      user.id,
      SentEmailType.Registration,
      new Date(),
    );

    if (sentToday.length >= this.settings.maxRegistrationEmailsPerDay) {
      return false;
    }

    const lastSent = sentToday.sort(
      (a, b) => b.sentAt.getTime() - a.sentAt.getTime(),
    )[0];
    if (lastSent) {
      const secondsSince =
        (Date.now() - lastSent.sentAt.getTime()) / 1000;
      if (
        secondsSince < this.settings.resendConfirmationEmailCooldownInSeconds
      ) {
        return false;
      }
    }

    await this.emailSender.sendEmailAsync(
      email,
      this.settings.from,
      this.settings.subject,
      `Confirm your email: ${confirmationUrl}`,
    );

    const sentEmail: SentEmail = {
      id: randomUUID(),
      userId: user.id,
      emailType: SentEmailType.Registration,
      sentAt: new Date(),
    };
    await this.sentEmailsRepo.insertAsync(sentEmail);
    return true;
  }
}
