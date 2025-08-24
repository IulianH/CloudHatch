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
            var token = await _auth.IssueTokenAsync(req.Email, req.Password);
            if (token == null) return Unauthorized();
            return Ok(new LoginResponseDto(
                token.AccessToken,
                token.RefreshToken,
                token.ExpiresInSeconds
            ));
        }

        // POST /api/auth/refresh
       
        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<RefreshResponseDto>> Refresh([FromBody] RefreshRequestDto req)
        {
            var token = await _auth.RefreshTokensAsync(req.RefreshToken);
            if (token == null) return Unauthorized();
            return Ok(new RefreshResponseDto(
                token.AccessToken,
                token.RefreshToken,
                token.ExpiresInSeconds
            ));
        }

        // POST /api/auth/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto req)
        {
            await _auth.RevokeRefreshTokenAsync(req.RefreshToken);
            return NoContent();
        }
    }
    public record LoginRequestDto(
    string Email,
    string Password
    );

    public record LoginResponseDto(
        string AccessToken,
        string RefreshToken,
        int ExpiresIn    // seconds
    );

    public record RefreshRequestDto(
        string RefreshToken
    );

    public record RefreshResponseDto(
        string AccessToken,
        string RefreshToken,
        int ExpiresIn
    );

    public record LogoutRequestDto(
        string RefreshToken
    );
}
