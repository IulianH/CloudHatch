using Users.App.Interface;
using Users.Domain;

namespace Users.Infra.InMemory
{
    public class InMemEmailService : IEmailService
    {
        public Task SendConfirmationEmailAsync(User user, string email, string confirmationUrl)
        {
            return Task.CompletedTask;
        }
    }
}
