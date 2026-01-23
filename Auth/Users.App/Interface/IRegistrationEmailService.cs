using Users.Domain;

namespace Users.App.Interface
{
    public interface IRegistrationEmailService
    {
        Task<bool> SendRegistrationEmailAsync(User user, string email, string confirmationUrl);
    }
}
