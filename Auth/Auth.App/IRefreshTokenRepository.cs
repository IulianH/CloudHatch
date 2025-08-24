namespace Auth.App
{
    public interface IRefreshTokenRepository
    {
        Task SaveAsync(RefreshTokenRecord record);
        Task<RefreshTokenRecord?> GetByTokenAsync(string token);
        Task DeleteAsync(string token);
        void Migrate();
    }
}
