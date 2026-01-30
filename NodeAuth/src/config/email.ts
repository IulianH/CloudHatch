export interface RegistrationEmailSettings {
  from: string;
  subject: string;
  maxRegistrationEmailsPerDay: number;
  resendConfirmationEmailCooldownInSeconds: number;
}

export interface ResetPasswordEmailSettings {
  from: string;
  subject: string;
  maxEmailsPerDay: number;
}
