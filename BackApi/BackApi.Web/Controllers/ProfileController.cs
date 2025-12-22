using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
                User.Identity?.Name,
                string.Join(",", User.FindAll(ClaimTypes.Role).Select(c => c.Value)),
                User.FindFirst("given_name")?.Value,
                User.FindFirst("family_name")?.Value
                ));
        }
    }

    public record UserProfile(
        string? UserName,
        string? Roles,
        string? GivenName,
        string? FamilyName
    );
}
