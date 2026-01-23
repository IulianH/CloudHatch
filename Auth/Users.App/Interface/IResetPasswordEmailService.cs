using Users.Domain;

namespace Users.App.Interface
{
    public interface IResetPasswordEmailService
    {
        Task<bool> SendResetPasswordEmailAsync(User user, string email, string resetPasswordUrl);
    }
}
