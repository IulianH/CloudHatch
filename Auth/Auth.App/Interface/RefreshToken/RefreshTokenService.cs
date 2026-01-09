using Auth.App.Env;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Security.Cryptography;

namespace Auth.App.Interface.RefreshToken
{
    public class RefreshTokenService(IRefreshTokenRepository repo, IOptions<RtConfig> rtConfig, ILogger<RefreshTokenService> logger)
    {
        private readonly RtConfig _rtConfig = rtConfig.Value;
        public async Task<string> GenerateAsync(Guid userId)
        {
            var now = DateTimeOffset.UtcNow;
            var record = GetRecord(userId, now, 1, now);
            await repo.CreateAsync(record);
            return record.Token;
        }

        public async Task<RefreshTokenRecord?> RefreshAsync(string token)
        {
            var record = await repo.GetAsync(token);
            if(record is null)
            {
                logger.LogWarning("Refresh token not found: {Token}", token);
                return null;
            }

            DateTimeOffset now = DateTimeOffset.UtcNow;
            var expired = now >= record.ExpiresAt;

            if(expired)
            {
                await repo.DeleteAsync(token);
                return null;
            }

            if(_rtConfig.SessionMaxAgeHours > 0)
            {
                var timePassed = now - record.SessionCreatedAt;
                if(timePassed.TotalHours >= _rtConfig.SessionMaxAgeHours)
                {
                    await repo.DeleteAsync(token);
                    return null;
                }
            }

            var newRecord = GetRecord(record.UserId, now, record.Index + 1, record.SessionCreatedAt);
            
            await Task.WhenAll(
                repo.DeleteAsync(token),
                repo.CreateAsync(newRecord)
            );

            return newRecord;
        }

        public async Task RevokeAsync(string token, bool revokeAll)
        {
            if(revokeAll)
            {
                var record = await repo.GetAsync(token);
                if (record != null)
                {
                    await repo.DeleteAsync(record.UserId);
                    return;
                }
            }
            await repo.DeleteAsync(token);
        }

        private RefreshTokenRecord GetRecord(Guid userId, DateTimeOffset now, int index, DateTimeOffset sessionCreatedAt)
        {
            return new RefreshTokenRecord
            {
                Token = GenerateRefreshToken(),
                UserId = userId,
                SessionCreatedAt = sessionCreatedAt,
                ExpiresAt = now.AddHours(_rtConfig.ExpiresInHours),
                Index = index
            };
        }

        private static string GenerateRefreshToken()
        { 
            // cryptographically secure random
            var bytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }
    }
}
