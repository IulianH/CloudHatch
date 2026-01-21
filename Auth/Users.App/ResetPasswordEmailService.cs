using Microsoft.Extensions.Options;
using Users.App.Interface;
using Users.App.Settings;
using Users.Domain;

namespace Users.App
{
    public class ResetPasswordEmailService(
        IEmailSender emailSender,
        IOptions<ResetPasswordEmailSettings> resetPasswordEmailSettings,
        ISentEmailsRepo sentEmailsRepo) : IResetPasswordEmailService
    {
        private readonly ResetPasswordEmailSettings _resetPasswordEmailSettings = resetPasswordEmailSettings.Value;

        public async Task<bool> SendResetPasswordEmailAsync(User user, string email, string resetPasswordUrl)
        {
            if (!await CanSendResetPasswordEmail(user))
            {
                return false;
            }

            var body = $"Reset your password by clicking this link: {resetPasswordUrl}";
            await emailSender.SendEmailAsync(
                email,
                _resetPasswordEmailSettings.From,
                _resetPasswordEmailSettings.Subject,
                body);

            var sentEmail = new SentEmail
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                EmailType = (int)SentEmailType.ResetPassword,
                SentAt = DateTimeOffset.UtcNow
            };

            await sentEmailsRepo.InsertAsync(sentEmail);
            return true;
        }

        private async Task<bool> CanSendResetPasswordEmail(User user)
        {
            var sentEmails = await sentEmailsRepo.GetSentEmailsForDateAsync(
                user.Id,
                SentEmailType.ResetPassword,
                DateTimeOffset.UtcNow.Date);

            return sentEmails.Count < _resetPasswordEmailSettings.MaxEmailsPerDay;
        }
    }
}
