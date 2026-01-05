using Auth.App.Env;
using Auth.App.Exceptions;
using Auth.App.Interface.RefreshToken;
using Microsoft.Extensions.Configuration;
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
    public class JwtTokenService(IOptions<JwtConfig> jwtConfig, IConfiguration config, IRefreshTokenRepository rtRepo, LoginService loginService, IUserRepo users)
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
            var user = await loginService.LoginAsync(new LoginRequest(username, password, true));
            if (user == null)
            {
                return null;
            }

            return await IssueTokens(user);
        }

        public async Task<TokenPair?> IssueTokenForFederatedUser(ClaimsPrincipal userIdentity)
        {
            if(userIdentity.Identity == null || userIdentity.Identity.IsAuthenticated == false)
            {
                throw new AppException("Null or anonymous user identity received"); 
            }

            var externalId = userIdentity.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (externalId == null)
            {
                throw new AppException("NameIdentifier claim not found");
            }

            var user = await users.FindByExternalIdAsync(externalId);
            if(user == null)
            {
                throw new AppException($"Cound not find an user for namidentifier {externalId}");
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
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var name = GetName(user);
            if(name != null)
            {
                claims.Add(new(JwtRegisteredClaimNames.Name, name));
            }

            if(user.GivenName != null)
            {
                claims.Add(new(JwtRegisteredClaimNames.GivenName, user.GivenName));
            }

            if (user.FamilyName != null)
            {
                claims.Add(new(JwtRegisteredClaimNames.FamilyName, user.FamilyName));
            }

            if (user.Email != null)
            {
                claims.Add(new(JwtRegisteredClaimNames.Email, user.Email));
            }

            claims.AddRange((user.Roles?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) 
                ?? Array.Empty<string>()).Select(x => new Claim(ClaimTypes.Role, x)));

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

        public string? GetName(User user)
        {
            var name = $"{user.GivenName ?? string.Empty} {user.FamilyName ?? string.Empty}";
            if (!string.IsNullOrWhiteSpace(name))
            {
                return name.Trim();
            }
            return user.Email ?? user.Username;
        }
    }
}
