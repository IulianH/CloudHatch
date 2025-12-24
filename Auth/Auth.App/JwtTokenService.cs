using Auth.App.Env;
using Auth.App.Exceptions;
using Auth.App.Interface.RefreshToken;
using Auth.App.Interface.Users;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Auth.App
{
    public class JwtTokenService(IUserService users, IOptions<JwtConfig> jwtConfig, IConfiguration config, IRefreshTokenRepository rtRepo)
    {
        private readonly JwtConfig _jwtConfig = jwtConfig.Value;
        
        public async Task<TokenPair?> RefreshTokensAsync(string refreshToken)
        {
            // 1) Lookup the record
            var record = await rtRepo.GetByTokenAsync(refreshToken);
            if (record == null || record.ExpiresAt < DateTime.UtcNow)
            {
                return null;
            }

            // 2) (Optional) rotate: delete old, issue new
            await rtRepo.DeleteAsync(record.Token);

            // 3) Issue new JWT + RT
            var user = await users.FindByIdAsync(record.UserId);
            if (user == null)
            {
                return null;
            }

            return await IssueTokens(user);
        }

        public async Task RevokeRefreshTokenAsync(string refreshToken)
        {
            if (!ValidateRefreshToken(refreshToken))
            {
                return;
            }
            await rtRepo.DeleteAsync(refreshToken);
        }

        public async Task<TokenPair?> IssueTokenAsync(string username, string password)
        {
            var user = await users.LoginAsync(username, password);
            if (user == null)
            {
                return null;
            }

            return await IssueTokens(user);

        }

        public async Task<TokenPair> IssueTokenForUserAsync(User user)
        {
            return await IssueTokens(user);
        }
        
        private static bool ValidateRefreshToken(string refreshToken)
        {
            if(string.IsNullOrWhiteSpace(refreshToken))
            {
                return false;
            }
            return true;
        }

        private async Task<TokenPair> IssueTokens(User user)
        {
            var jwt = GenerateJwtToken(user);
            var rToken = GenerateRefreshToken();

            await rtRepo.SaveAsync(new RefreshTokenRecord
            {
                Token = rToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddHours(config.GetValue<int>("Rt:ExpiresInHours"))
            });

            return new TokenPair(jwt, rToken, _jwtConfig.ExpiresInSeconds, user);
        }

        private string GenerateJwtToken(User user)
        {
            var keyBytes = Convert.FromBase64String(_jwtConfig.Key);
            var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddSeconds(_jwtConfig.ExpiresInSeconds);

            var claims = new List<Claim> {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.PreferredUsername, user.Username),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            if(user.GivenName != null)
            {
                claims.Add(new(JwtRegisteredClaimNames.GivenName, user.GivenName));
            }

            if (user.FamilyName != null)
            {
                claims.Add(new(JwtRegisteredClaimNames.FamilyName, user.FamilyName));
            }

            claims.AddRange(user.Roles.Select(x => new Claim(ClaimTypes.Role, x)));

            var token = new JwtSecurityToken(
                issuer: _jwtConfig.Issuer,
                audience: _jwtConfig.Audience,
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );
           
            var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);

            return tokenStr;
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
