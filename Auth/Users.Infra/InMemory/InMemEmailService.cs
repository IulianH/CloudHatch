using Users.App.Interface;

namespace Users.Infra.InMemory
{
    public class InMemEmailService : IEmailService
    {
        public Task SendConfirmationEmailAsync(string email, string confirmationUrl)
        {
            return Task.CompletedTask;
        }
    }
}
