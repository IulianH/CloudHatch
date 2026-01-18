namespace Users.App.Settings
{
    public class RegisterSettings
    {
        public int EmailConfirmationTokenExpiresInHours { get; set; }

        public required string EmailConfirmUrl { get; set; }
    }
}
