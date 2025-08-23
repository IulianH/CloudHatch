namespace Auth.App.Internal.Repository
{
    internal interface IUserService
    {
        Task<User> FindByUserNameAsync(string userName);
        Task<bool> CheckPasswordAsync(User harborUser, string password);
        Task<User> FindByIdAsync(string id);
        void Migrate();
    }
}
