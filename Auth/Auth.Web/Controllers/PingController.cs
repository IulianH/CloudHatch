using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PingController : ControllerBase
    {
        public IActionResult Get()
        {
            return Ok("pong");
        }
    }
}
