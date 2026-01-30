import { IEmailSender } from "../interfaces/IEmailSender";

export class InMemoryEmailSender implements IEmailSender {
  async sendEmailAsync(
    _toEmail: string,
    _fromEmail: string,
    _subject: string,
    _body: string,
  ): Promise<void> {
    // No-op for in-memory email sender.
  }
}
