export interface IEmailSender {
  sendEmailAsync(
    toEmail: string,
    fromEmail: string,
    subject: string,
    body: string,
  ): Promise<void>;
}
