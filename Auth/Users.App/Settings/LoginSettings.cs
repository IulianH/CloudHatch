namespace Users.App.Settings
{
    public class LoginSettings
    {
        public int MaxFailedPasswordLoginAttempts { get; set; }

        public int AccountLockDurationInMinutes { get; set; }

        public int LockoutStartsAfterAttempts { get; set; }
    }
}
