export interface RegistrationEmailSettings {
  from: string;
  subject: string;
  maxRegistrationEmailsPerDay: number;
  resendConfirmationEmailCooldownInSeconds: number;
}
