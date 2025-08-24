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

            // set HttpOnly refresh cookie
            Response.Cookies.Append("__Host-refresh", token.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                MaxAge = TimeSpan.FromDays(30)
            });

            return Ok(new LoginResponseDto(
                token.AccessToken,
                token.RefreshToken,
                token.ExpiresInSeconds
            ));
        }

        // POST /api/auth/refresh

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<RefreshResponseDto>> Refresh([FromBody] RefreshRequestDto? body)
        {
            // 1) Prefer HttpOnly cookie
            var rt = Request.Cookies["__Host-refresh"];

            // 2) Fallback to body (optional, e.g., for native clients)
            if (string.IsNullOrEmpty(rt))
                rt = body?.RefreshToken;

            if (string.IsNullOrEmpty(rt)) return Unauthorized();

            var pair = await _auth.RefreshTokensAsync(rt);
            if (pair is null) return Unauthorized();

            // Rotate cookie
            Response.Cookies.Append("__Host-refresh", pair.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                MaxAge = TimeSpan.FromDays(30)
            });

            return Ok(new RefreshResponseDto(
               pair.AccessToken,
               pair.RefreshToken,
               pair.ExpiresInSeconds
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
