using Users.App.Interface;

namespace Users.Infra.InMemory
{
    public class InMemEmailSender : IEmailSender
    {
        public Task SendEmailAsync(string toEmail, string fromEmail, string subject, string body)
        {
            return Task.CompletedTask;
        }
    }
}
