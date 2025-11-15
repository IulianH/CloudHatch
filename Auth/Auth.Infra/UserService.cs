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
                return new User
                {
                    Id = response.Id,
                    Username = response.Username,
                    CreatedAt = response.CreatedAt
                };
            }
            return null;
        }

        public async Task<User?> FindByIdAsync(Guid userId)
        {
            var response = await userRepo.FindByIdAsync(userId);

            if (response != null)
            {
                return new User
                {
                    Id = response.Id,
                    Username = response.Username,
                    CreatedAt = response.CreatedAt
                };
            }

            return null;
        }
    }
}
