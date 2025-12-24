using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using Auth.App;
using Auth.Web.Configuration;
using Auth.Web.Extensions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;


namespace Auth.Web.Controllers
{
    [ApiController]
    [Route("/")]
    public class AuthController(JwtTokenService auth, GoogleOAuthService googleOAuth, IDataProtectionProvider dp, OriginValidator originValidator, 
        IOptions<AuthCookieOptions> cookieOptions, ILogger<AuthController> logger) : ControllerBase
    {
        private readonly AuthCookieOptions _cookieOptions = cookieOptions.Value;

        [HttpPost("login")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto req)
        {
            var token = await auth.IssueTokenAsync(req.Username, req.Password);
            if (token == null) return Unauthorized();

            return Ok(new LoginResponseDto(
                token.AccessToken,
                token.RefreshToken,
                token.ExpiresIn,
                new UserResponseDto(token.User.Username)

            ));
        }

        [HttpPost("web-login")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<WebLoginResponseDto>> WebLogin([FromBody] LoginRequestDto req)
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var token = await auth.IssueTokenAsync(req.Username, req.Password);
            if (token == null) return Unauthorized();

            var protector = CreateProtector();
            IssueCookie(token.RefreshToken, protector);
            return Ok(new WebLoginResponseDto(
                token.AccessToken,
                token.ExpiresIn,
                new UserResponseDto(token.User.Username)
            ));
        }


        [HttpPost("refresh")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<RefreshResponseDto>> Refresh([FromBody] RefreshRequestDto body)
        {
            var pair = await auth.RefreshTokensAsync(body.RefreshToken);
            if (pair is null) return Unauthorized();

            return Ok(new RefreshResponseDto(
                pair.AccessToken,
                pair.RefreshToken,
                pair.ExpiresIn
            ));
        }

        [HttpPost("web-refresh")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<WebRefreshResponseDto>> WebRefresh()
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var protector = CreateProtector();
            var refreshToken = ReadRefreshTokenFromCookie(protector);
            if (refreshToken == null)
            {
                return Unauthorized();
            }

            var pair = await auth.RefreshTokensAsync(refreshToken);
            if (pair is null) return Unauthorized();

            IssueCookie(pair.RefreshToken, protector);
            
            
            return Ok(new WebRefreshResponseDto(
               pair.AccessToken,
               pair.ExpiresIn
           ));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto req)
        {
            await auth.RevokeRefreshTokenAsync(req.RefreshToken);
            return NoContent();
        }

        [HttpPost("web-logout")]
        public async Task<IActionResult> WebLogout([FromBody] WebLogoutRequestDto req)
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var refreshToken = ReadRefreshTokenFromCookie(CreateProtector());
            if (refreshToken == null)
            {
                return NoContent();
            }

            await auth.RevokeRefreshTokenAsync(refreshToken);
            DeleteCookie();
            return NoContent();
        }

        [HttpGet("google-login")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public IActionResult GoogleLogin()
        {
            var properties = new AuthenticationProperties { RedirectUri = "/google-callback" };
            return Challenge(properties, "Google");
        }

        [HttpGet("google-callback")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> GoogleCallback()
        {
            var result = await HttpContext.AuthenticateAsync("Google");
            if (!result.Succeeded || result.Principal == null)
            {
                logger.LogWarning("Google authentication failed");
                await HttpContext.SignOutAsync("Google");
                return Unauthorized(new { error = "Google authentication failed" });
            }

            var tokenPair = await googleOAuth.AuthenticateAsync(result.Principal);
            
            // Sign out the Google scheme to clean up temporary authentication cookie
            await HttpContext.SignOutAsync("Google");
            
            if (tokenPair == null)
            {
                logger.LogWarning("User not found for Google email");
                return Unauthorized(new { error = "No account found with this email address. Please create an account first." });
            }

            return Ok(new LoginResponseDto(
                tokenPair.AccessToken,
                tokenPair.RefreshToken,
                tokenPair.ExpiresIn,
                new UserResponseDto(tokenPair.User.Username)
            ));
        }

        [HttpGet("web-google-login")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public IActionResult WebGoogleLogin()
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var properties = new AuthenticationProperties { RedirectUri = "/web-google-callback" };
            return Challenge(properties, "Google");
        }

        [HttpGet("web-google-callback")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> WebGoogleCallback()
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var result = await HttpContext.AuthenticateAsync("Google");
            if (!result.Succeeded || result.Principal == null)
            {
                logger.LogWarning("Google authentication failed");
                await HttpContext.SignOutAsync("Google");
                return Unauthorized(new { error = "Google authentication failed" });
            }

            var tokenPair = await googleOAuth.AuthenticateAsync(result.Principal);
            
            // Sign out the Google scheme to clean up temporary authentication cookie
            await HttpContext.SignOutAsync("Google");
            
            if (tokenPair == null)
            {
                logger.LogWarning("User not found for Google email");
                return Unauthorized(new { error = "No account found with this email address. Please create an account first." });
            }

            var protector = CreateProtector();
            IssueCookie(tokenPair.RefreshToken, protector);
            return Ok(new WebLoginResponseDto(
                tokenPair.AccessToken,
                tokenPair.ExpiresIn,
                new UserResponseDto(tokenPair.User.Username)
            ));
        }

        private string? ReadRefreshTokenFromCookie(IDataProtector protector)
        {
            if (!Request.Cookies.TryGetValue(_cookieOptions.Name, out var protectedValue))
            {
                return null;
            }

            string json;
            try
            {
                json = protector.Unprotect(protectedValue);
            }
            catch (CryptographicException)
            {
                logger.LogWarning("Failed to unprotect refresh token");
                return null;
            }
            var dto = System.Text.Json.JsonSerializer.Deserialize<RefreshDto>(json);
            return dto!.rt;
        }

        private IDataProtector CreateProtector() => dp.CreateProtector("Tokens.Cookie:v1");

        private bool IsAllowedOrigin(HttpRequest r) => originValidator.IsAllowedOrigin(r);

        private void IssueCookie(string refreshToken, IDataProtector dp)
        {
            var newJson = System.Text.Json.JsonSerializer.Serialize(new { rt = refreshToken, v = 1 });
            var newProtected = dp.Protect(newJson);

            Response.Cookies.Append(_cookieOptions.Name, newProtected, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = _cookieOptions.Path,
                MaxAge = TimeSpan.FromHours(_cookieOptions.MaxAgeHours),
                Domain = _cookieOptions.Domain
            });
        }
        
        private void DeleteCookie()
        {
            Response.Cookies.Delete(_cookieOptions.Name, new CookieOptions
            {
                Path = _cookieOptions.Path,
                Domain = _cookieOptions.Domain
            });
        }
    }



    public static class ValidationConstants
    {
        public const string UsernameRequired = "Username is required.";
        public const string PasswordRequired = "Password is required.";
        public const string RefreshTokenRequired = "Refresh token is required.";

        // Regex patterns
        //3–20 characters
        //Letters, digits, underscores(_), dots(.), hyphens(-)
        //Cannot start or end with.or -
        //Cannot have consecutive..or --
        public const string UsernamePattern = @"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9._-]{1,18}[a-zA-Z0-9])?|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$";
        public const string PasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$";

        // Error messages for regex validation
        public const string UsernameFormatError = "3–20 characters, letters, digits, underscores(_), dots(.), hyphens(-), cannot start or end with.or -, cannot have consecutive..or --";
        public const string PasswordFormatError = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    }

    record RefreshDto(string rt, int v);

    public record LoginRequestDto(
        [Required(ErrorMessage = ValidationConstants.UsernameRequired)]
        [RegularExpression(ValidationConstants.UsernamePattern, ErrorMessage = ValidationConstants.UsernameFormatError)]
        string Username,
        [Required(AllowEmptyStrings = false, ErrorMessage = ValidationConstants.PasswordRequired)]
        string Password
    );

    public record UserResponseDto(
        string Username
    );

    public record WebLoginResponseDto(
        string AccessToken,
        int ExpiresIn,
        UserResponseDto User
    );

    public record LoginResponseDto(
        string AccessToken,
        string RefreshToken,
        int ExpiresIn,
        UserResponseDto User

    ) : WebLoginResponseDto(AccessToken, ExpiresIn, User);

    public record RefreshRequestDto(
        [Required(AllowEmptyStrings = false)]
        string RefreshToken
    );

    public record WebRefreshResponseDto(
        string AccessToken,
        int ExpiresIn
    );

    public record RefreshResponseDto(
        string AccessToken,
        string RefreshToken,
        int ExpiresIn

    ) : WebRefreshResponseDto(AccessToken, ExpiresIn);

    public record WebLogoutRequestDto(
        bool LogoutAll
    );

    public record LogoutRequestDto(
        [Required(AllowEmptyStrings = false)]
        string RefreshToken,
        bool LogoutAll
    ) : WebLogoutRequestDto(LogoutAll);
}
