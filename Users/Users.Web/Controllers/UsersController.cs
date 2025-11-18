using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Users.App.Interface;
using static Users.Web.Controllers.LoginController;

namespace Users.Web.Controllers
{
    [Route("users")]
    [ApiController]
    public class UsersController(IUserRepo repo) : ControllerBase
    {
        [HttpGet("{id}")]
        public async Task<ActionResult<UserResponse>> GetById(Guid id)
        {
            var user = await repo.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var response = new UserResponse
            {
                Id = user.Id,
                Username = user.Username,
                CreatedAt = user.CreatedAt
            };

            return Ok(response);
        }
    }
}
