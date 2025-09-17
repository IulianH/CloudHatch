using System.ComponentModel.DataAnnotations;
using Auth.App;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(JwtTokenService auth) : ControllerBase
    {
        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto req)
        {
            var token = await auth.IssueTokenAsync(req.Username, req.Password);
            if (token == null) return Unauthorized();

            return Ok(new LoginResponseDto(
                token.AccessToken,
                token.RefreshToken,
                token.ExpiresAt,
                new UserResponseDto(token.User.Id, token.User.Username)
            ));
        }

        // POST /api/auth/refresh
        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<RefreshResponseDto>> Refresh([FromBody] RefreshRequestDto body)
        {
            var pair = await auth.RefreshTokensAsync(body.RefreshToken);
            if (pair is null) return Unauthorized();


            return Ok(new RefreshResponseDto(
               pair.AccessToken,
               pair.RefreshToken,
               pair.ExpiresAt,
               new UserResponseDto(pair.User.Id, pair.User.Username)
           ));
        }


        // POST /api/auth/logout
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
        public const string UsernamePattern = @"^[a-zA-Z0-9_]{3,20}$";
        public const string PasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$";
        
        // Error messages for regex validation
        public const string UsernameFormatError = "Username must be 3-20 characters long and contain only letters, numbers, and underscores.";
        public const string PasswordFormatError = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    }

    
    public record LoginRequestDto(
    [Required]    
    string Username,
    [Required]   
    string Password
    );

    public record UserResponseDto(
        Guid Id,
        string Username
    );
        
    public record LoginResponseDto(
        string AccessToken,
        string RefreshToken,
        DateTime ExpiresAt,
        UserResponseDto User
    );

    public record RefreshRequestDto(
        [Required]
        string RefreshToken
    );

    public record RefreshResponseDto(
        string AccessToken,
        string RefreshToken,
        DateTime ExpiresAt,
        UserResponseDto User
    );

    public record LogoutRequestDto(
        string RefreshToken,
        bool LogoutAll
    );
}
