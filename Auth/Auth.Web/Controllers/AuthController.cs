using Auth.App;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly JwtTokenService _auth;
        public AuthController(JwtTokenService auth) => _auth = auth;

        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto req)
        {
            var token = await _auth.IssueTokenAsync(req.Username, req.Password);
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
            var pair = await _auth.RefreshTokensAsync(body.RefreshToken);
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
            await _auth.RevokeRefreshTokenAsync(req.RefreshToken);
            return NoContent();
        }
    }
    public record LoginRequestDto(
    string Username,
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
