import type { SentEmail, SentEmailType } from "../../models/SentEmail";
import type { ISentEmailsRepo } from "../interfaces/ISentEmailsRepo";
import { queryAsync } from "./db";

type SentEmailRow = {
  id: string;
  user_id: string;
  email_type: number;
  sent_at: Date;
};

const mapSentEmailRow = (row: SentEmailRow): SentEmail => ({
  id: row.id,
  userId: row.user_id,
  emailType: row.email_type as SentEmailType,
  sentAt: row.sent_at,
});

const getDateRangeForLocalDay = (date: Date): { from: Date; to: Date } => {
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
};

export class PostgresSentEmailsRepo implements ISentEmailsRepo {
  async getSentEmailsForDateAsync(
    userId: string,
    emailType: SentEmailType,
    date: Date,
  ): Promise<SentEmail[]> {
    const { from, to } = getDateRangeForLocalDay(date);
    const result = await queryAsync<SentEmailRow>(
      `
        SELECT * FROM sent_emails
        WHERE user_id = $1
          AND email_type = $2
          AND sent_at >= $3
          AND sent_at < $4
        ORDER BY sent_at ASC
      `,
      [userId, emailType, from, to],
    );

    return result.rows.map(mapSentEmailRow);
  }

  async insertAsync(sentEmail: SentEmail): Promise<void> {
    await queryAsync(
      `
        INSERT INTO sent_emails (
          id,
          user_id,
          email_type,
          sent_at
        )
        VALUES ($1, $2, $3, $4)
      `,
      [sentEmail.id, sentEmail.userId, sentEmail.emailType, sentEmail.sentAt],
    );
  }
}
