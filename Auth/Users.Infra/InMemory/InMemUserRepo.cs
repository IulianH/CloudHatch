using Users.App;
using Users.App.Interface;
using Users.Domain;

namespace Users.Infra.InMemory
{
    public class InMemUserRepo : IUserRepo
    {
        private readonly List<User> _users = [];
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

        public Task<User?> FindByEmailAsync(string email)
        {
            // Match by email if username is in email format, or by normalized username
            var normalizedEmail = email.ToUpperInvariant();
            var user = _users.FirstOrDefault(x => 
                x.NormalizedUsername.Equals(normalizedEmail, StringComparison.InvariantCultureIgnoreCase) ||
                x.Username.Equals(email, StringComparison.InvariantCultureIgnoreCase));
            return Task.FromResult(user);
        }

        public void Migrate()
        {
            var user = new User
            {
                CreatedAt = DateTime.UtcNow,
                Username = "admin",
                NormalizedUsername = "ADMIN",
                GivenName = "John",
                FamilyName = "Doe",
                Roles = "customer,admin",
                Password = PasswordHasher.Hash("admin1!"),
                Id = Guid.NewGuid()
            };
            _users.Add(user);

            user = new User
            {
                CreatedAt = DateTime.UtcNow,
                Username = "customer",
                NormalizedUsername = "CUSTOMER",
                GivenName = "Jane",
                FamilyName = "Doe",
                Roles = "customer",
                Password = PasswordHasher.Hash("customer1!"),
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
