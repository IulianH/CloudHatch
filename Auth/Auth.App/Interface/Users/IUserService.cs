namespace Auth.App.Interface.Users
{
    public interface IUserService
    {
        Task<User?> LoginAsync(string username, string password);
        Task<User?> FindByIdAsync(Guid userId);
        Task<User?> FindByEmailAsync(string email);
    }
}
