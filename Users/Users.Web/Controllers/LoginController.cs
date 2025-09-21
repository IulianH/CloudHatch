using Microsoft.AspNetCore.Mvc;
using Users.App;
using Users.Domain;

namespace Users.Web.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class LoginController(LoginService loginService) : ControllerBase
    {
        [HttpPost]
        public async Task<ActionResult<UserResponse>> Login([FromBody] LoginRequest request)
        {
            var user = await loginService.Login(request);
            if(user == null)
            {
                return Unauthorized();
            }
     
            return Ok(ToReturnValue(user));
        }

        private static UserResponse ToReturnValue(User user)
        {
            return new UserResponse
            {
                Id = user.Id,
                Username = user.Username,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
