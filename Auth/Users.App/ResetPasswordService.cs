using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using Users.App.Interface;
using Users.App.Settings;

namespace Users.App
{
    public class ResetPasswordService(
        IUserRepo repo,
        IResetPasswordEmailService emailService,
        IOptions<ResetPasswordSettings> resetPasswordSettings)
    {
        private readonly ResetPasswordSettings _resetPasswordSettings = resetPasswordSettings.Value;

        public async Task<bool> SendResetPasswordEmail(string email)
        {
            var existingUser = await repo.FindByEmailAsync(email);
            if (existingUser == null || existingUser.EmailConfirmed == false || Constants.IsLocalAccount(existingUser.Issuer) == false)
            {
                return false;
            }

            var resetToken = GenerateResetPasswordToken();
            var resetUrl = $"{_resetPasswordSettings.ResetPasswordUrl}?token={Uri.EscapeDataString(resetToken)}";

            bool sent = await emailService.SendResetPasswordEmailAsync(existingUser, email, resetUrl);
            if (!sent)
            {
                return false;
            }

            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_resetPasswordSettings.ResetPasswordTokenExpiresInMinutes);
            existingUser.ResetPasswordToken = resetToken;
            existingUser.ResetPasswordTokenExpiresAt = expiresAt;
            await repo.UpdateAsync(existingUser);
            return true;
        }

        private static string GenerateResetPasswordToken()
        {
            var bytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }
    }
}
