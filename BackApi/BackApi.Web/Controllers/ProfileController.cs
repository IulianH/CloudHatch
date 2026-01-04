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
                 User.FindFirst(JwtRegisteredClaimNames.Name)?.Value,
                string.Join(",", User.FindAll(ClaimTypes.Role).Select(c => c.Value)),
                User.FindFirst(JwtRegisteredClaimNames.GivenName)?.Value,
                User.FindFirst(JwtRegisteredClaimNames.FamilyName)?.Value
                ));
        }
    }

    public record UserProfile(
        string? Name,
        string? Roles,
        string? GivenName,
        string? FamilyName
    );
}
