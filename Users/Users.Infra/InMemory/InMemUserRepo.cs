using Users.App;
using Users.App.Interface;
using Users.Domain;

namespace Users.Infra.InMemory
{
    public class InMemUserRepo : IUserRepo
    {
        private List<User> _users = [];
        public Task AddAsync(User user)
        {
            _users.Add(user);

            return Task.CompletedTask;
        }

        public Task<User?> FindByIdAsync(Guid id)
        {
            var user = _users.FirstOrDefault(x => x.Id == id);
            return Task.FromResult(user);
        }

        public Task<User?> FindByUserNameAsync(string userName)
        {
            var user = _users.FirstOrDefault(x => x.NormalizedUsername.Equals(userName, StringComparison.InvariantCultureIgnoreCase));
            return Task.FromResult(user);
        }

        public void Migrate()
        {
            var user = new User
            {
                CreatedAt = DateTime.UtcNow,
                Username = "admin",
                NormalizedUsername = "ADMIN",
                Password = PasswordHasher.Hash("admin1!"),
                Id = Guid.NewGuid()
            };
            _users.Add(user);
        }

        public Task UpdateAsync(User user)
        {
            return Task.CompletedTask;
        }
    }
}
