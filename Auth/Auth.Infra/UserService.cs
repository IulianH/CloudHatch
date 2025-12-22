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
               return GetUser(response);
            }
            return null;
        }

        public async Task<User?> FindByIdAsync(Guid userId)
        {
            var response = await userRepo.FindByIdAsync(userId);

            if (response != null)
            {
                return GetUser(response);
            }

            return null;
        }

        private User GetUser(Users.Domain.User user)
        {
            return new User
            {
                Id = user.Id,
                Username = user.Username,
                CreatedAt = user.CreatedAt,
                GivenName = user.GivenName,
                FamilyName = user.FamilyName,
                Roles = user.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            };
        }
    }
}
