using Users.App;
using Users.App.Interface;
using Users.Domain;

namespace Users.Infra.InMemory
{
    public class InMemUserRepo : IUserRepo
    {
        private readonly List<User> _users = [];
        public Task InsertAsync(User user)
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
            var user = _users.FirstOrDefault(x => string.Equals(x.Username, userName, StringComparison.InvariantCultureIgnoreCase));
            return Task.FromResult(user);
        }

        public void Migrate()
        {
            var user = new User
            {
                CreatedAt = DateTime.UtcNow,
                Username = "admin@admin.com",
                Email = "admin@admin.com",
                Name = "John Doe",
                Roles = "customer,admin",
                Password = PasswordHasher.Hash("admin1!"),
                Id = Guid.NewGuid(),
                Issuer = "local"
            };
            _users.Add(user);

            user = new User
            {
                CreatedAt = DateTime.UtcNow,
                Username = "customer@customer.com",
                Email = "customer@customer.com",
                Name = "Jane Doe",
                Roles = "customer",
                Password = PasswordHasher.Hash("customer1!"),
                Id = Guid.NewGuid(),
                Issuer = "local"
            };

            _users.Add(user);
        }

        public Task UpdateAsync(User user)
        {
            return Task.CompletedTask;
        }

        public Task<User?> FindByExternalIdAsync(string externalId)
        {
            var user = _users.FirstOrDefault(x => x.ExternalId == externalId);
            return Task.FromResult(user);
        }
    }
}
