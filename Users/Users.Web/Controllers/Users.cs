using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Users.App;
using Users.Domain;

namespace Users.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Users : ControllerBase
    {
        private readonly UserService _userService;

        [HttpPost("login")]
        public async Task<ActionResult<UserResponse>> Login([FromBody] LoginRequest request)
        {
            var user = await _userService.Login(request);
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
