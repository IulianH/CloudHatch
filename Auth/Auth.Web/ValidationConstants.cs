namespace Auth.Web
{
    public static class ValidationConstants
    {
        public const string EmailRequired = "Email is required.";
        public const string UsernameRequired = "Username is required.";
        public const string PasswordRequired = "Password is required.";
        public const string ResetPasswordTokenRequired = "Reset password token is required.";
        public const string ConfirmEmailTokenRequired = "Confirmation token is required.";
        public const string RefreshTokenRequired = "Refresh token is required.";

        // Regex patterns
        //3–20 characters
        //Letters, digits, underscores(_), dots(.), hyphens(-)
        //Cannot start or end with.or -
        //Cannot have consecutive..or --
        public const string EmailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
        public const string PasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$";

        // Error messages for regex validation
        public const string EmailFormatError = "Invalid email format.";
        public const string PasswordFormatError = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    }
}
