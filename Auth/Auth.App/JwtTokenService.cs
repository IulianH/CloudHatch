using Auth.App.Env;
using Auth.App.Exceptions;
using Auth.App.Interface.RefreshToken;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using Users.App;
using Users.App.Interface;
using Users.Domain;

namespace Auth.App
{
    public class JwtTokenService(IOptions<JwtConfig> jwtConfig, RefreshTokenService rtService, 
        LoginService loginService, IUserRepo users, ILogger<JwtTokenService> logger)
    {
        private readonly JwtConfig _jwtConfig = jwtConfig.Value;

        public async Task<TokenPair?> RefreshTokensAsync(string refreshToken)
        {
            // 1) Lookup the record
            var record = await rtService.RefreshAsync(refreshToken);
            
            if(record == null)
            {
                return null;
            }

            // 3) Issue new JWT + RT
            var user = await users.FindByIdAsync(record.UserId);
            
            if (user == null)
            {
                logger.LogWarning("RefreshTokensAsync: Could not find {UserId} via refresh token", record.UserId);
                return null;
            }

            return await IssueTokens(user);
        }

        public async Task RevokeRefreshTokenAsync(string refreshToken, bool revokeAll)
        {
           await rtService.RevokeAsync(refreshToken, revokeAll);
        }

        public async Task<TokenPair?> IssueTokenAsync(string username, string password)
        {
            var user = await loginService.LoginAsync(new LoginRequest(username, password, true, _jwtConfig.Issuer));
            if (user == null)
            {
                return null;
            }

            return await IssueTokens(user);
        }

        public async Task<TokenPair?> IssueTokensForFederatedUser(string externalId)
        {
            var user = await loginService.LoginFederatedAsync(externalId, true);
            if(user == null)
            {
                return null;
            }

            return await IssueTokens(user);
        }

        public async Task<TokenPair> IssueTokensForUserAsync(User user)
        {
            return await IssueTokens(user);
        }
       

        private async Task<TokenPair> IssueTokens(User user)
        {
            var jwt = GenerateJwtToken(user);
            var rToken = await rtService.GenerateAsync(user.Id);
            return new TokenPair(jwt, rToken, _jwtConfig.ExpiresInSeconds, user);
        }

        private string GenerateJwtToken(User user)
        {
            var keyBytes = Convert.FromBase64String(_jwtConfig.Key);
            var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddSeconds(_jwtConfig.ExpiresInSeconds);

            var claims = new List<Claim> {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            if(user.Name != null)
            {
                claims.Add(new(JwtRegisteredClaimNames.Name, user.Name));
            }

            if (user.Email != null)
            {
                claims.Add(new(JwtRegisteredClaimNames.Email, user.Email));
            }

            claims.AddRange((user.Roles?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) 
                ?? Array.Empty<string>()).Select(x => new Claim(ClaimTypes.Role, x)));

            claims.Add(new("idp", Constants.GetIdp(user.Issuer)));

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
    }
}
