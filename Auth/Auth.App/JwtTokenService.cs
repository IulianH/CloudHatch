using Auth.App.Interface.RefreshToken;
using Auth.App.Interface.Users;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Auth.App
{
    public class JwtTokenService(IUserService users, IConfiguration config, IRefreshTokenRepository rtRepo)
    {
        public async Task<TokenPair?> RefreshTokensAsync(string refreshToken)
        {
            // 1) Lookup the record
            var record = await rtRepo.GetByTokenAsync(refreshToken);
            if (record == null || record.ExpiresAt < DateTime.UtcNow)
                return null;

            // 2) (Optional) rotate: delete old, issue new
            await rtRepo.DeleteAsync(record.Token);

            // 3) Issue new JWT + RT
            var user = await users.FindByIdAsync(record.UserId);
            if (user == null) return null;

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

            return new TokenPair(jwt, rToken, config.GetValue<int>("Jwt:ExpiresInSeconds"), user);
        }

        private string GenerateJwtToken(User user)
        {
            var keyBytes = Convert.FromBase64String(config["Jwt:Key"]!);
            var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddSeconds(config.GetValue<int>("Jwt:ExpiresInSeconds"));

            var claims = new[] {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.PreferredUsername, user.Username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "owner")
            // add role claims here if needed
        };

            var token = new JwtSecurityToken(
                issuer: config["Jwt:Issuer"],
                audience: config["Jwt:Audience"],
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
