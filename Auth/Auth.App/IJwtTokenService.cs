namespace Auth.App
{
    public interface IJwtTokenService
    {
        Task<TokenPair?> IssueTokenAsync(string email, string password);

        Task<TokenPair?> RefreshTokensAsync(string refreshToken);

        Task RevokeRefreshTokenAsync(string refreshToken);

        void MigrateStores();
    }
}
