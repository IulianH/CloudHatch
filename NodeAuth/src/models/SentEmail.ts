export enum SentEmailType {
  None = 0,
  Registration = 1,
  ResetPassword = 2,
}

export interface SentEmail {
  id: string;
  userId: string;
  emailType: SentEmailType;
  sentAt: Date;
}
