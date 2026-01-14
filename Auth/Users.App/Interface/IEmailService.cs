using Users.Domain;

namespace Users.App.Interface
{
    public interface IEmailService
    {
        Task SendConfirmationEmailAsync(User user, string email, string confirmationUrl);
    }
}
