using Auth.App.Interface.RefreshToken;

namespace Auth.Infra.RefreshToken.InMemory
{
    internal class InMemoryRefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly Dictionary<string, RefreshTokenRecord> _refreshTokens = new();

        public Task UpdateAsync(RefreshTokenRecord record)
        {
            _refreshTokens[record.Token] = record;
            return Task.CompletedTask;
        }

        public Task<RefreshTokenRecord?> GetByTokenAsync(string token)
        {
            _refreshTokens.TryGetValue(token, out var record);
            return Task.FromResult(record);
        }

        public Task DeleteAsync(string token)
        {
            _refreshTokens.Remove(token);
            return Task.CompletedTask;
        }

        public void Migrate()
        {
            
        }

        public Task<RefreshTokenRecord?> GetAsync(string token)
        {
            _refreshTokens.TryGetValue(token, out var record);
            return Task.FromResult(record);
        }

        public Task CreateAsync(RefreshTokenRecord record)
        {
            _refreshTokens[record.Token] = record;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid userId)
        {
            var record = _refreshTokens.FirstOrDefault(kvp => kvp.Value.UserId == userId);
            if (record.Key != null)
            {
                _refreshTokens.Remove(record.Key);
            }
            return Task.CompletedTask;
        }
    }
}
