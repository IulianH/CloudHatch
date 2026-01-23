using System.Text.RegularExpressions;
using Users.App.Interface;

namespace Users.App
{
    public class ChangePasswordService(IUserRepo repo)
    {
        public async Task<ChangePasswordResult> ChangePasswordAsync(ChangePasswordRequest request)
        {
            var user = await repo.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return new ChangePasswordResult
                {
                    Success = false,
                    Error = "UserNotFound",
                    ErrorDescription = "User was not found."
                };
            }

            if (request.LockEnabled)
            {
                if (user.IsLocked || (user.LockedUntil.HasValue && DateTimeOffset.UtcNow <= user.LockedUntil.Value))
                {
                    return new ChangePasswordResult
                    {
                        Success = false,
                        Error = "AccountLocked",
                        ErrorDescription = "Account is locked."
                    };
                }
            }

            if (Constants.IsLocalAccount(user.Issuer) == false)
            {
                return new ChangePasswordResult
                {
                    Success = false,
                    Error = "InvalidAccountType",
                    ErrorDescription = "Cannot change password for federated accounts."
                };
            }

            if (user.Password == null || !PasswordHasher.Verify(user.Password, request.OldPassword))
            {
                return new ChangePasswordResult
                {
                    Success = false,
                    Error = "InvalidOldPassword",
                    ErrorDescription = "Old password is incorrect."
                };
            }

            if (!Regex.IsMatch(request.NewPassword, Validation.PasswordPattern))
            {
                return new ChangePasswordResult
                {
                    Success = false,
                    Error = "InvalidPasswordFormat",
                    ErrorDescription = Validation.PasswordFormatError
                };
            }

            user.Password = PasswordHasher.Hash(request.NewPassword);
            await repo.UpdateAsync(user);

            return new ChangePasswordResult { Success = true };
        }
    }

    public class ChangePasswordResult
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
        public string? ErrorDescription { get; set; }
    }

    internal static class Validation
    {
        public const string PasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$";
        public const string PasswordFormatError = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    }
}
