using Microsoft.Extensions.Options;
using System.Data;
using System.Security.Cryptography;
using Users.App.Interface;
using Users.App.Settings;
using Users.Domain;

namespace Users.App
{
    public class RegistrationService(IUserRepo repo, IRegistrationEmailService emailService, IOptions<RegisterSettings> registerSettings)
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
            if (existingUser != null && existingUser.EmailConfirmed)
            {
                return new RegistrationResult { Success = true };
            }
            var hashedPassword = PasswordHasher.Hash(password);
            if (existingUser != null && existingUser.EmailConfirmed == false)
            {
                existingUser.Password = hashedPassword;
                var token = GenerateConfirmationToken();
                existingUser.EmailConfirmationToken = token;
                await repo.UpdateAsync(existingUser);
                var confUrl = $"{_registerSettings.EmailConfirmUrl}?token={Uri.EscapeDataString(token)}";
                await emailService.SendRegistrationEmailAsync(existingUser, email, confUrl);

                return new RegistrationResult { Success = true };
            }
            
            var expiresAt = DateTimeOffset.UtcNow.AddHours(_registerSettings.EmailConfirmationTokenExpiresInHours);
            var confirmationToken = GenerateConfirmationToken();
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
                Roles = "customer"
            };

            await repo.InsertAsync(newUser);

            var url = $"{_registerSettings.EmailConfirmUrl}?token={Uri.EscapeDataString(confirmationToken)}";
            await emailService.SendRegistrationEmailAsync(newUser, email, url);

            return new RegistrationResult { Success = true };
        }

        public async Task<bool> ResendRegistrationEmail(string email)
        {
            var existingUser = await repo.FindByEmailAsync(email);
            if(existingUser == null || existingUser.EmailConfirmed)
            {
                return false;
            }
            var confirmationToken = GenerateConfirmationToken();

            bool sent = await emailService.SendRegistrationEmailAsync(
                existingUser,
                email,
                $"{_registerSettings.EmailConfirmUrl}?token={Uri.EscapeDataString(confirmationToken)}");
            if (!sent)
            {
                return false;
            }

            var expiresAt = DateTimeOffset.UtcNow.AddHours(_registerSettings.EmailConfirmationTokenExpiresInHours);
            existingUser.EmailConfirmationToken = confirmationToken;
            existingUser.EmailConfirmationTokenExpiresAt = expiresAt;
            await repo.UpdateAsync(existingUser);
            return true;
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
