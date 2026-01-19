using Microsoft.Extensions.Options;
using Users.App.Interface;
using Users.App.Settings;
using Users.Domain;

namespace Users.App
{
    public class RegistrationEmailService(
        IEmailSender emailSender,
        IOptions<RegistrationEmailSettings> registrationEmailSettings,
        ISentEmailsRepo sentEmailsRepo) : IRegistrationEmailService
    {
        private readonly RegistrationEmailSettings _registrationEmailSettings = registrationEmailSettings.Value;

        public async Task<bool> SendRegistrationEmailAsync(User user, string email, string confirmationUrl)
        {
            if (!await CanSendRegistrationEmail(user))
            {
                return false;
            }
            var body = $"Please confirm your email by clicking this link: {confirmationUrl}";
            await emailSender.SendEmailAsync(
                email,
                _registrationEmailSettings.From,
                _registrationEmailSettings.Subject,
                body);

            var sentEmail = new SentEmail
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                EmailType = (int)SentEmailType.Registration,
                SentAt = DateTimeOffset.UtcNow
            };

            await sentEmailsRepo.InsertAsync(sentEmail);
            return true;
        }

        private async Task<bool> CanSendRegistrationEmail(User user)
        {
            var sentEmails = await sentEmailsRepo.GetSentEmailsForDateAsync(
                user.Id,
                SentEmailType.Registration,
                DateTimeOffset.UtcNow.Date);
            if (sentEmails.Count >= _registrationEmailSettings.MaxRegsitrationEmailsPerDay)
            {
                return false;
            }
            if (sentEmails.Any())
            {
                var lastSentEmail = sentEmails.OrderByDescending(e => e.SentAt).First();
                var cooldownPeriod = TimeSpan.FromSeconds(_registrationEmailSettings.ResendConfirmationEmailCooldownInSeconds);
                if (DateTimeOffset.UtcNow - lastSentEmail.SentAt < cooldownPeriod)
                {
                    return false;
                }
            }
            return true;
        }
    }
}
