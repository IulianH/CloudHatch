using Auth.App.Interface.Users;
using Users.App;
using Users.App.Interface;

namespace Auth.Infra
{
    public class UserService(LoginService loginService, IUserRepo userRepo) : IUserService
    {
        public async Task<User?> LoginAsync(string username, string password)
        {
            var loginRequest = new LoginRequest(username, password, true);

            var response = await loginService.Login(loginRequest);

            if (response != null)
            {
               return GetExternalUser(response);
            }
            return null;
        }

        public async Task<User?> FindByIdAsync(Guid userId)
        {
            var response = await userRepo.FindByIdAsync(userId);

            if (response != null)
            {
                return GetExternalUser(response);
            }

            return null;
        }

        public async Task<User?> FindByEmailAsync(string email)
        {
            var response = await userRepo.FindByEmailAsync(email);

            if (response != null)
            {
                return GetExternalUser(response);
            }

            return null;
        }

        private User GetExternalUser(Users.Domain.User user)
        {
            return new User
            {
                Id = user.Id,
                Username = user.Username,
                CreatedAt = user.CreatedAt,
                GivenName = user.GivenName,
                FamilyName = user.FamilyName,
                UserEmail = user.Email,
                Roles = user.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            };
        }

        public async Task<User> UpsertAsync(string email, string givenName, string surname)
        {
            DateTime now = DateTime.UtcNow;
            email = email.Trim().ToLowerInvariant();
            var user = await userRepo.FindByEmailAsync(email);
            if (user != null)
            {
                user.GivenName = givenName;
                user.FamilyName = surname;
                user.LastLogin = now;
                await userRepo.UpdateAsync(user);
                return GetExternalUser(user);
            }

           
            user = new Users.Domain.User
            {
                Id = Guid.NewGuid(),
                CreatedAt = now,
                LastLogin = now,
                Email = email,
                Username = email,
                NormalizedUsername = email.ToUpperInvariant(),
                GivenName = givenName,
                FamilyName = surname,
                Roles = "customer"
            };

            await userRepo.AddAsync(user);
            return GetExternalUser(user);
        }
    }
}
