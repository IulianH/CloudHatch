namespace Auth.App.Interface.RefreshToken
{
    public interface IRefreshTokenRepository
    {
        Task SaveAsync(RefreshTokenRecord record);
        Task<RefreshTokenRecord?> GetByTokenAsync(string token);
        Task DeleteAsync(string token);
        void Migrate();
    }
}
