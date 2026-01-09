namespace Auth.App.Interface.RefreshToken
{
    public interface IRefreshTokenRepository
    {
        Task<RefreshTokenRecord?> GetAsync(string token);
        Task CreateAsync(RefreshTokenRecord record);
        Task UpdateAsync(RefreshTokenRecord record);
        Task DeleteAsync(string token);
        Task DeleteAsync(Guid userId);
        void Migrate();
    }
}
