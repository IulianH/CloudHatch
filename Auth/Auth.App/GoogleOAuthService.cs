using Auth.App.Interface.Users;
using System.Security.Claims;

namespace Auth.App
{
    public class GoogleOAuthService(IUserService userService, JwtTokenService jwtTokenService)
    {
        public async Task<TokenPair?> AuthenticateAsync(ClaimsPrincipal googlePrincipal)
        {
            // Extract email from Google claims
            var email = googlePrincipal.FindFirst(ClaimTypes.Email)?.Value 
                ?? googlePrincipal.FindFirst("email")?.Value
                ?? googlePrincipal.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;

            if (string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            // Find user by email (link-only mode)
            var user = await userService.FindByEmailAsync(email);
            if (user == null)
            {
                return null;
            }

            // Issue tokens for the linked user
            return await jwtTokenService.IssueTokenForUserAsync(user);
        }
    }
}

