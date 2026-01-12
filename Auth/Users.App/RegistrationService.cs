using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using Users.App.Interface;
using Users.App.Settings;
using Users.Domain;

namespace Users.App
{
    public class RegistrationService(IUserRepo repo, IEmailService emailService, IOptions<RegisterSettings> registerSettings)
    {
        private readonly RegisterSettings _registerSettings = registerSettings.Value;

        public async Task<bool> RegisterFederatedAsync(FederatedUser fedUser)
        {
            var user = await repo.FindByExternalIdAsync(fedUser.Id);
            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    ExternalId = fedUser.Id,
                    Issuer = fedUser.Issuer,
                    Email = fedUser.Email,
                    Username = fedUser.Username ?? fedUser.Email,
                    Name = fedUser.Name,
                    CreatedAt = DateTime.UtcNow,
                    Roles = "customer"
                };
                await repo.InsertAsync(user);
                return true;
            }
            user.Issuer = fedUser.Issuer;
            user.Email = fedUser.Email;
            user.Username = fedUser.Username ?? fedUser.Email;
            user.Name = fedUser.Name;
            await repo.UpdateAsync(user);
            return true;
        }

        public async Task<RegistrationResult> RegisterAsync(string email, string password)
        {
            // Check if user already exists
            var existingUser = await repo.FindByEmailAsync(email);
            if (existingUser != null)
            {
                return new RegistrationResult { Success = true };
            }

            // Create new user
            var hashedPassword = PasswordHasher.Hash(password);
            var confirmationToken = GenerateConfirmationToken();
            var expiresAt = DateTimeOffset.UtcNow.AddHours(_registerSettings.EmailConfirmationTokenExpiresInHours);

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                Username = email,
                Password = hashedPassword,
                EmailConfirmed = false,
                EmailConfirmationToken = confirmationToken,
                EmailConfirmationTokenExpiresAt = expiresAt,
                Issuer = "local",
                CreatedAt = DateTimeOffset.UtcNow,
                Roles = "customer",
                ConfirmationEmailSentTimestamps = new List<DateTimeOffset> { DateTimeOffset.UtcNow }
            };

            await repo.InsertAsync(newUser);

            var url = $"{_registerSettings.EmailConfirmUrl}?token={Uri.EscapeDataString(confirmationToken)}";
            await emailService.SendConfirmationEmailAsync(email, url);

            return new RegistrationResult { Success = true };
        }

        public async Task<EmailConfirmationResult> ConfirmEmailAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return new EmailConfirmationResult
                {
                    Success = false,
                    Error = "InvalidToken",
                    ErrorDescription = "Token is required."
                };
            }

            var user = await repo.FindByConfirmationTokenAsync(token);
            if (user == null)
            {
                return new EmailConfirmationResult
                {
                    Success = false,
                    Error = "InvalidToken",
                    ErrorDescription = "Invalid confirmation token."
                };
            }

            if (user.EmailConfirmed)
            {
                return new EmailConfirmationResult
                {
                    Success = false,
                    Error = "AlreadyConfirmed",
                    ErrorDescription = "Email has already been confirmed."
                };
            }

            if (user.EmailConfirmationTokenExpiresAt == null || 
                DateTimeOffset.UtcNow > user.EmailConfirmationTokenExpiresAt.Value)
            {
                return new EmailConfirmationResult
                {
                    Success = false,
                    Error = "TokenExpired",
                    ErrorDescription = "Confirmation token has expired."
                };
            }

            user.EmailConfirmed = true;
            user.EmailConfirmationToken = null;
            user.EmailConfirmationTokenExpiresAt = null;
            await repo.UpdateAsync(user);

            return new EmailConfirmationResult { Success = true };
        }

        private static string GenerateConfirmationToken()
        {
            var bytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }
    }

    public class RegistrationResult
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
        public string? ErrorDescription { get; set; }
    }

    public class EmailConfirmationResult
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
        public string? ErrorDescription { get; set; }
    }
}
