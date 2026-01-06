using System.Security.Claims;
using Users.App.Interface;
using Users.Domain;

namespace Users.App
{
    public class LoginService(IUserRepo repo)
    {
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

            var matched = PasswordHasher.Verify(user.Password, request.Password);

            if (!matched)
            {
                return null;
            }

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

        public async Task<User> LoginFederatedAsync(ClaimsPrincipal ctx)
        {
            var externalId = ctx.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new ArgumentException("Null NameIdentifier received in federated login");
            var issuer = ctx.FindFirst("iss")?.Value ?? throw new ArgumentException("Null issuer received in federated login");
            var email = ctx.FindFirst(ClaimTypes.Email)?.Value?.ToLower();
            var name = ctx.FindFirst("name")?.Value;
            var username = ctx.FindFirst("preferred_username")?.Value;

            var user = await repo.FindByExternalIdAsync(externalId);
            if(user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    ExternalId = externalId,
                    Issuer = issuer,
                    Email = email,
                    Username = username ?? email,
                    Name = name,
                    LastLogin = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    Roles = "customer"
                };
                await repo.InsertAsync(user);
                return user;
            }
            user.Issuer = issuer;
            user.Email = email;
            user.Username = username ?? email;
            user.Name = name;
            user.LastLogin = DateTime.UtcNow;
            await repo.UpdateAsync(user);
            return user;
        }
    }
}
