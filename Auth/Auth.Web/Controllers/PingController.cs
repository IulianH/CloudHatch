using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Controllers
{
    [Route(GlobalConstants.BasePath)]
    [ApiController]
    public class PingController : ControllerBase
    {
        [HttpGet("ping")]
        public IActionResult Get() => Ok("pong");
    }
}
