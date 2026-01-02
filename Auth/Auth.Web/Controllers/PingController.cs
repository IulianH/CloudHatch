using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Controllers
{
    [Route("/")]
    [ApiController]
    public class PingController : ControllerBase
    {
        [HttpGet("ping")]
        public IActionResult Get() => Ok("pong");
    }
}
