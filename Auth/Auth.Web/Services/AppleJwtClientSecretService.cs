using Auth.App.Env;
using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Microsoft.IdentityModel.Tokens;

namespace Auth.Web.Services
{
    public interface IAppleJwtClientSecretService
    {
        string GenerateClientSecret();
    }

    public class AppleJwtClientSecretService : IAppleJwtClientSecretService
    {
        private readonly AppleOAuthConfig _config;
        private readonly ILogger<AppleJwtClientSecretService> _logger;

        public AppleJwtClientSecretService(IOptions<AppleOAuthConfig> config, ILogger<AppleJwtClientSecretService> logger)
        {
            _config = config.Value;
            _logger = logger;
        }

        public string GenerateClientSecret()
        {
            try
            {
                // Parse the private key (PEM format)
                var privateKey = LoadPrivateKey(_config.PrivateKey);

                // Create ECDsa security key with Key ID
                var securityKey = new ECDsaSecurityKey(privateKey)
                {
                    KeyId = _config.KeyId
                };

                // Create signing credentials with ES256 algorithm
                var signingCredentials = new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.EcdsaSha256);

                // Create JWT claims
                var now = DateTime.UtcNow;
                var claims = new[]
                {
                    new System.Security.Claims.Claim("iss", _config.TeamId),
                    new System.Security.Claims.Claim("iat", new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), System.Security.Claims.ClaimValueTypes.Integer64),
                    new System.Security.Claims.Claim("exp", new DateTimeOffset(now.AddMonths(6)).ToUnixTimeSeconds().ToString(), System.Security.Claims.ClaimValueTypes.Integer64),
                    new System.Security.Claims.Claim("aud", "https://appleid.apple.com"),
                    new System.Security.Claims.Claim("sub", _config.ClientId)
                };

                // Create JWT token with Key ID in header
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new System.Security.Claims.ClaimsIdentity(claims),
                    SigningCredentials = signingCredentials
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var token = tokenHandler.CreateToken(tokenDescriptor);
                
                // Ensure Key ID is in the header
                if (token is JwtSecurityToken jwtToken)
                {
                    jwtToken.Header["kid"] = _config.KeyId;
                }
                
                return tokenHandler.WriteToken(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate Apple JWT client secret");
                throw new InvalidOperationException("Failed to generate Apple JWT client secret", ex);
            }
        }

        private ECDsa LoadPrivateKey(string privateKeyPem)
        {
            try
            {
                // Remove PEM headers/footers and whitespace
                var keyContent = privateKeyPem
                    .Replace("-----BEGIN PRIVATE KEY-----", "")
                    .Replace("-----END PRIVATE KEY-----", "")
                    .Replace("-----BEGIN EC PRIVATE KEY-----", "")
                    .Replace("-----END EC PRIVATE KEY-----", "")
                    .Replace("\r", "")
                    .Replace("\n", "")
                    .Replace(" ", "");

                // Decode base64
                var keyBytes = Convert.FromBase64String(keyContent);

                // Create ECDsa and import the private key
                var ecdsa = ECDsa.Create();
                
                // Try to import as ECPrivateKey first (common for Apple keys)
                try
                {
                    ecdsa.ImportECPrivateKey(keyBytes, out _);
                }
                catch
                {
                    // If that fails, try PKCS#8 format
                    try
                    {
                        ecdsa.ImportPkcs8PrivateKey(keyBytes, out _);
                    }
                    catch
                    {
                        // Last resort: try loading as X509Certificate2
                        using var cert = new X509Certificate2(keyBytes);
                        using var certKey = cert.GetECDsaPrivateKey();
                        if (certKey != null)
                        {
                            ecdsa = ECDsa.Create();
                            ecdsa.ImportParameters(certKey.ExportParameters(true));
                        }
                        else
                        {
                            throw new InvalidOperationException("Unable to extract ECDsa private key from certificate");
                        }
                    }
                }

                return ecdsa;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load Apple private key");
                throw new InvalidOperationException("Failed to load Apple private key. Ensure it's in PEM format (PKCS#8 or EC Private Key).", ex);
            }
        }
    }
}

