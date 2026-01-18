namespace Users.App.Settings
{
    public class RegistrationEmailSettings
    {
        public required string From { get; set; }

        public required string Subject { get; set; }

        public required int MaxRegsitrationEmailsPerDay { get; set; }

        public required int ResendConfirmationEmailCooldownInSeconds { get; set; }
    }
}
