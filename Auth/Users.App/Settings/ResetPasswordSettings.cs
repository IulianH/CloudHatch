namespace Users.App.Settings
{
    public class ResetPasswordSettings
    {
        public required string ResetPasswordUrl { get; set; }

        public int ResetPasswordTokenExpiresInMinutes { get; set; }
    }
}
