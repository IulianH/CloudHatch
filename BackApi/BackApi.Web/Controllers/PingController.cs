using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackApi.Web.Controllers
{
    [Route("/")]
    public class PingController : ControllerBase
    {

        [HttpGet("ping")]
        public IActionResult Ping() => Ok(new { message = "pong" });
    }
}
