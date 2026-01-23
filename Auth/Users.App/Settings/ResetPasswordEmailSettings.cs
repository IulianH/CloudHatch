namespace Users.App.Settings
{
    public class ResetPasswordEmailSettings
    {
        public required string From { get; set; }

        public required string Subject { get; set; }

        public required int MaxEmailsPerDay { get; set; }
    }
}
