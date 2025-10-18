using System.ComponentModel.DataAnnotations;
using Auth.App;
using Auth.Web.Extensions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;


namespace Auth.Web.Controllers
{
    [ApiController]
    [Route("/")]
    public class AuthController(JwtTokenService auth, IDataProtectionProvider dp, 
    IOptions<AuthCookieOptions> cookieOptions, ILogger<AuthController> logger) : ControllerBase
    {
        private readonly AuthCookieOptions _cookieOptions = cookieOptions.Value;

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto req)
        {
            var token = await auth.IssueTokenAsync(req.Username, req.Password);
            if (token == null) return Unauthorized();

            return Ok(new LoginResponseDto(
                token.AccessToken,
                token.ExpiresAt,
                new UserResponseDto(token.User.Id, token.User.Username),
                token.RefreshToken
            ));
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<RefreshResponseDto>> Refresh([FromBody] RefreshRequestDto body)
        {
            var pair = await auth.RefreshTokensAsync(body.RefreshToken);
            if (pair is null) return Unauthorized();


            return Ok(new RefreshResponseDto(
               pair.AccessToken,
               pair.ExpiresAt,
               new UserResponseDto(pair.User.Id, pair.User.Username),
               pair.RefreshToken
           ));
        }

        [HttpPost("webrefresh")]
        public async Task<ActionResult<RefreshResponseDto>> WebRefresh([FromBody] RefreshRequestDto body)
        {
            if (!IsAllowedOrigin(Request)) 
            {
                logger.LogWarning("Request is not from an allowed origin");
                return Forbid();  // simple CSRF guard  :contentReference[oaicite:2]{index=2}
            }
            if (!Request.Cookies.TryGetValue(_cookieOptions.Name, out var protectedValue))
            {
                logger.LogWarning("No cookie was sent in the request");
                return Unauthorized();
            }

            var pair = await auth.RefreshTokensAsync(body.RefreshToken);
            if (pair is null) return Unauthorized();

            var protector = CreateProtector();
            try
            {
                var unprotectedValue = protector.Unprotect(protectedValue);
                if (unprotectedValue == null) return Unauthorized();
            }
            catch (System.Security.Cryptography.CryptographicException)
            {
                logger.LogWarning("Failed to unprotect refresh token");
                return Unauthorized();
            }
            var unprotectedValue = protector.Unprotect(protectedValue);
            if (unprotectedValue == null) return Unauthorized();

            return Ok(new RefreshResponseDto(
               pair.AccessToken,
               pair.ExpiresAt,
               new UserResponseDto(pair.User.Id, pair.User.Username),
               pair.RefreshToken
           ));
        }


        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto req)
        {
            await auth.RevokeRefreshTokenAsync(req.RefreshToken);
            return NoContent();
        }

        private IDataProtector CreateProtector() => dp.CreateProtector("Tokens.Cookie:v1");
        
        private bool IsAllowedOrigin(HttpRequest r) =>
             r.Headers["Origin"] == $"https://{_cookieOptions.Domain}"
                || r.Headers["Referer"].ToString().StartsWith($"https://{_cookieOptions.Domain}/");
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

    
    public record LoginRequestDto(
        [Required(ErrorMessage = ValidationConstants.UsernameRequired)]
        [RegularExpression(ValidationConstants.UsernamePattern, ErrorMessage = ValidationConstants.UsernameFormatError)]
        string Username,
        [Required(ErrorMessage = ValidationConstants.PasswordRequired)]
        string Password
    );

    public record UserResponseDto(
        Guid Id,
        string Username
    );

    public record WebLoginResponseDto(
        string AccessToken,
        DateTime ExpiresAt,
        UserResponseDto User
    );
        
    public record LoginResponseDto(
        string AccessToken,
        DateTime ExpiresAt,
        UserResponseDto User,
        string RefreshToken
    ) : WebLoginResponseDto(AccessToken, ExpiresAt, User);

    public record RefreshRequestDto(
        [Required]
        string RefreshToken
    );

    public record WebRefreshResponseDto(
        string AccessToken,
        DateTime ExpiresAt,
        UserResponseDto User
    );

    public record RefreshResponseDto(
        string AccessToken,
        DateTime ExpiresAt,
        UserResponseDto User,
        string RefreshToken
    ) : WebRefreshResponseDto(AccessToken, ExpiresAt, User);


    public record LogoutRequestDto(
        [Required]
        string RefreshToken,
        bool LogoutAll
    );
}
