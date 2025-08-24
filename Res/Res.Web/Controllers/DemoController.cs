using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Res.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DemoController : ControllerBase
    {
        // Public health-check
        [HttpGet("ping")]
        [AllowAnonymous]
        public IActionResult Ping() => Ok(new { message = "pong" });

        // Protected: requires a valid access token from Auth
        [HttpGet("secure")]
        [Authorize]
        public IActionResult Secure()
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? "<missing>";
            var name = User.Identity?.Name
                     ?? User.FindFirst(JwtRegisteredClaimNames.PreferredUsername)?.Value;
            var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value);

            return Ok(new { message = "authorized", sub, name, roles });
        }
    }
}
