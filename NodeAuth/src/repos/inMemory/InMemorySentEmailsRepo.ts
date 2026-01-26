import { SentEmail, SentEmailType } from "../../models/SentEmail";
import { ISentEmailsRepo } from "../interfaces/ISentEmailsRepo";

export class InMemorySentEmailsRepo implements ISentEmailsRepo {
  private readonly sentEmails: SentEmail[] = [];

  async getSentEmailsForDateAsync(
    userId: string,
    emailType: SentEmailType,
    date: Date,
  ): Promise<SentEmail[]> {
    const dateOnly = date.toDateString();
    return this.sentEmails.filter(
      (email) =>
        email.userId === userId &&
        email.emailType === emailType &&
        email.sentAt.toDateString() === dateOnly,
    );
  }

  async insertAsync(sentEmail: SentEmail): Promise<void> {
    this.sentEmails.push(sentEmail);
  }
}
