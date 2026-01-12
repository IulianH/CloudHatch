namespace Users.App.Settings
{
    public class RegisterSettings
    {
        public int EmailConfirmationTokenExpiresInHours { get; set; }

        public int MaxConfirmationEmailsPerDay { get; set; }

        public required string EmailConfirmUrl { get; set; }
    }
}
