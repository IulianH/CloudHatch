using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BackApi.Web.Controllers
{
    [Route("/")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        [Authorize]
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            return Ok(new UserProfile(
                 User.FindFirst(JwtRegisteredClaimNames.Name)?.Value ?? 
                 User.FindFirst(JwtRegisteredClaimNames.Email)?.Value 
                 ?? User.FindFirst(JwtRegisteredClaimNames.PreferredUsername)?.Value
                 ?? "External User",
                 User.FindFirst("idp")?.Value ?? "local"
                ));
        }
    }

    public record UserProfile(
        string? Name,
        string Idp
    );
}
