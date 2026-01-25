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
}
