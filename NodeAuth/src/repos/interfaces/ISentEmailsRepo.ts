import { SentEmail, SentEmailType } from "../../models/SentEmail";

export interface ISentEmailsRepo {
  getSentEmailsForDateAsync(
    userId: string,
    emailType: SentEmailType,
    date: Date,
  ): Promise<SentEmail[]>;
  insertAsync(sentEmail: SentEmail): Promise<void>;
}
