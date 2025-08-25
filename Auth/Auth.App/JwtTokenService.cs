using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace Auth.App
{
    public class JwtTokenService(IUserService users, IConfiguration config, IRefreshTokenRepository rtRepo)
    {
        // Constraints(common in databases) :

        //Username rules:

        //3–20 characters

        //Letters, digits, underscores(_), dots(.), hyphens(-)

        //Cannot start or end with.or -

        //Cannot have consecutive..or --

        //Email rules:
        //Simplified but practical RFC-like check
        private static readonly Regex UsernameRegex = new(@"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9._-]{1,18}[a-zA-Z0-9])?|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

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

            var newJwt = GenerateJwtToken(user);
            var newRToken = GenerateRefreshToken();
            await rtRepo.SaveAsync(new RefreshTokenRecord
            {
                Token = newRToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            });

            return new TokenPair(newJwt, newRToken, ExpiresInSeconds: config.GetValue<int>("Jwt:ExpiresInSeconds"));
        }

        public Task RevokeRefreshTokenAsync(string refreshToken)
        {
            throw new NotImplementedException();
        }

        public async Task<TokenPair?> IssueTokenAsync(string username, string password)
        {
            Validate(username, password);

            var user = await users.FindByUserNameAsync(username);
            if (user == null) return null;

            if (!await users.CheckPasswordAsync(user, password))
                return null;

            // Create tokens
            var jwt = GenerateJwtToken(user);
            var rToken = GenerateRefreshToken();

            await rtRepo.SaveAsync(new RefreshTokenRecord
            {
                Token = rToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            });

            return new TokenPair(jwt, rToken, ExpiresInSeconds: config.GetValue<int>("Jwt:ExpiresInSeconds"));

        }

        private void Validate(string username, string password)
        {
            var valid = ValidateUserName(username) && ValidatePassword(password);
            if (!valid)
            {
                throw new InputException("Invalid username or password format");
            }
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

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            // cryptographically secure random
            var bytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }

        private bool ValidateUserName(string username)
        {
            var valid = username.Length > 2 && UsernameRegex.IsMatch(username);
            return valid;
        }

        private bool ValidatePassword(string password)
        {
            var valid = password.Length > 5 && password.All(c => char.IsLetterOrDigit(c) || char.IsPunctuation(c) || char.IsWhiteSpace(c));
            return valid;
        }
    }
}
