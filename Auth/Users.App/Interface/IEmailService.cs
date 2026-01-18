using Users.Domain;

namespace Users.App.Interface
{
    public interface IEmailService
    {
        Task<bool> SendRegistrationEmailAsync(User user, string email, string confirmationUrl);
    }
}
