using System.ComponentModel.DataAnnotations;
using Auth.App;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Controllers
{
    [ApiController]
    [Route("/")]
    public class AuthController(JwtTokenService auth) : ControllerBase
    {
        [HttpPost("login")]
        public async Task<ActionResult<HttpLoginResponseDto>> Login([FromBody] HttpLoginRequestDto req)
        {
            var token = await auth.IssueTokenAsync(req.Username, req.Password);
            if (token == null) return Unauthorized();

            return Ok(new HttpLoginResponseDto(
                token.AccessToken,
                token.RefreshToken,
                token.ExpiresAt,
                new HttpUserResponseDto(token.User.Id, token.User.Username)
            ));
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<HttpRefreshResponseDto>> Refresh([FromBody] HttpRefreshRequestDto body)
        {
            var pair = await auth.RefreshTokensAsync(body.RefreshToken);
            if (pair is null) return Unauthorized();


            return Ok(new HttpRefreshResponseDto(
               pair.AccessToken,
               pair.RefreshToken,
               pair.ExpiresAt,
               new HttpUserResponseDto(pair.User.Id, pair.User.Username)
           ));
        }


        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto req)
        {
            await auth.RevokeRefreshTokenAsync(req.RefreshToken);
            return NoContent();
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

    
    public record HttpLoginRequestDto(
        [Required(ErrorMessage = ValidationConstants.UsernameRequired)]
        [RegularExpression(ValidationConstants.UsernamePattern, ErrorMessage = ValidationConstants.UsernameFormatError)]
        string Username,
        [Required(ErrorMessage = ValidationConstants.PasswordRequired)]
        string Password
    );

    public record HttpUserResponseDto(
        Guid Id,
        string Username
    );
        
    public record HttpLoginResponseDto(
        string AccessToken,
        string RefreshToken,
        DateTime ExpiresAt,
        HttpUserResponseDto User
    );

    public record HttpRefreshRequestDto(
        [Required]
        string RefreshToken
    );

    public record HttpRefreshResponseDto(
        string AccessToken,
        string RefreshToken,
        DateTime ExpiresAt,
        HttpUserResponseDto User
    );

    public record LogoutRequestDto(
        [Required]
        string RefreshToken,
        bool LogoutAll
    );
}
