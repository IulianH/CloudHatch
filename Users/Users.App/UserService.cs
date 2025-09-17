using Users.App.Interface;
using Users.Domain;

namespace Users.App
{
    public class UserService(IUserRepo repo)
    {
        public async Task<User?> Login(LoginRequest request)
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

            var matched = PasswordHasher.Verify(user.Password, request.Password);

            if (!matched) return null;
            
            user.LockedUntil = null;
            user.IsLocked = false;
            user.LastLogin = DateTime.UtcNow;
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

            var matched = PasswordHasher.Verify(user.Password, request.OldPassword);

            if (!matched)
            {
                return false;
            }

            user.Password = PasswordHasher.Hash(request.NewPassword);
            user.LockedUntil = null;
            user.IsLocked = false;
            await repo.UpdateAsync(user);
            return true;
        }
    }
}
