using Microsoft.Extensions.Options;
using Users.App.Interface;
using Users.App.Settings;
using Users.Domain;

namespace Users.App
{
    public class EmailService(
        IEmailSender emailSender,
        IOptions<RegistrationEmailSettings> registrationEmailSettings,
        ISentEmailsRepo sentEmailsRepo) : IEmailService
    {
        private readonly RegistrationEmailSettings _registrationEmailSettings = registrationEmailSettings.Value;

        public async Task SendConfirmationEmailAsync(User user, string email, string confirmationUrl)
        {
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
        }
    }
}
