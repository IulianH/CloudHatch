using Microsoft.Extensions.Options;
using System.Security.Claims;
using Users.App.Interface;
using Users.App.Settings;
using Users.Domain;

namespace Users.App
{
    public class LoginService(IUserRepo repo, IOptions<LoginSettings> loginSettings)
    {
        private readonly LoginSettings _loginSettings = loginSettings.Value;
        public async Task<User?> LoginAsync(LoginRequest request)
        {
            var user = await repo.FindByUserNameAsync(request.Username);
            
            if (user == null || (request.LockEnabled && user.IsLocked))
            {
                return null;
            }

            if(request.LockEnabled && user.LockedUntil.HasValue)
            {
                if(DateTime.UtcNow <= user.LockedUntil.Value)
                {
                    return null;
                }
            }

            if(user.Password == null)
            {
                return null;
            }

            var matched = PasswordHasher.Verify(user.Password, request.Password);

            if (!matched)
            {
                user.FailedLoginCount += 1;
                if (user.FailedLoginCount >= _loginSettings.MaxFailedPasswordLoginAttempts)
                {
                    user.IsLocked = true;
                }
                else
                {
                    if(user.FailedLoginCount == _loginSettings.LockoutStartsAfterAttempts)
                    {
                        user.LockedUntil = DateTime.UtcNow.AddMinutes(_loginSettings.AccountLockDurationInMinutes);
                    }
                }

                await repo.UpdateAsync(user);
                return null;
            }
            if(user.EmailConfirmed == false)
            {
                return user;
            }

            user.LockedUntil = null;
            user.LastLogin = DateTime.UtcNow;
            user.FailedLoginCount = 0;
            await repo.UpdateAsync(user);
            return user;

        }

        public async Task<bool> ChangePassword(ChangePasswordRequest request)
        {
            var user = await repo.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return false;
            }
            if (user == null || (request.LockEnabled && user.IsLocked))
            {
                return false;
            }

            if (user.Password == null)
            {
                return false;
            }

            var matched = PasswordHasher.Verify(user.Password, request.OldPassword);

            if (!matched)
            {
                return false;
            }

            user.Password = PasswordHasher.Hash(request.NewPassword);
            await repo.UpdateAsync(user);
            return true;
        }

        public async Task<User?> LoginFederatedAsync(string externalId, bool lockedEnabled)
        {
            var user = await repo.FindByExternalIdAsync(externalId);

            if (user == null || (lockedEnabled && user.IsLocked))
            {
                return null;
            }

            var now = DateTimeOffset.UtcNow;
            if (lockedEnabled && user.LockedUntil.HasValue)
            {
                if (now <= user.LockedUntil.Value)
                {
                    return null;
                }
            }

            user.LastLogin = now;
            user.LockedUntil = null;
            user.FailedLoginCount = 0;
            await repo.UpdateAsync(user);
            return user;
        }
    }
}
