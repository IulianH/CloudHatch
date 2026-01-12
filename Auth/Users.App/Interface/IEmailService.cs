namespace Users.App.Interface
{
    public interface IEmailService
    {
        Task SendConfirmationEmailAsync(string email, string confirmationUrl);
    }
}
