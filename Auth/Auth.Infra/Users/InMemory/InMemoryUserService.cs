using Auth.App;

namespace Auth.Infra.Users.InMemory
{
    internal class InMemoryUserService : IUserService
    {
        private List<InternalUser> _users = [];
        public InMemoryUserService()
        {
           
        }

        public Task<bool> CheckPasswordAsync(User harborUser, string password)
        {
            var user = _users.FirstOrDefault(x => x.Id == Guid.Parse(harborUser.Id));
            var matched = PasswordHasher.Verify(user.Password, password);
            return Task.FromResult(matched);
        }

        public Task<User> FindByIdAsync(string id)
        {
            var user = _users.FirstOrDefault(x => x.Id == Guid.Parse(id));
            return Task.FromResult(user.ToHarborUser());
        }

        public Task<User> FindByUserNameAsync(string userName)
        {
            var user = _users.FirstOrDefault(x => x.Username == userName);
            return Task.FromResult(user.ToHarborUser());
        }

        public void Migrate()
        {
            var user = new InternalUser
            {
                CreatedAt = DateTime.Now,
                Username = "admin",
                Password = PasswordHasher.Hash("admin1!"),
                Id = Guid.NewGuid()
            };
            _users.Add(user);
        }
    }
}
