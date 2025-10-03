using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Controllers
{
    [Route("ping")]
    [ApiController]
    public class PingController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok("pong");
    }
}
