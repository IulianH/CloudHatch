using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackApi.Web.Controllers
{
    [Route("/")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        [Authorize(Policy = "AdminOnly")]
        [HttpGet("admin")]
        public IActionResult GetAdmin()
        {
            return Ok(new { message = "Admin endpoint accessed successfully" });
        }
    }
}

