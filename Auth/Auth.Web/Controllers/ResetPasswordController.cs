using Auth.App;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using Users.App;

namespace Auth.Web.Controllers
{
    [ApiController]
    [Route(GlobalConstants.BasePath)]
    public class ResetPasswordController(ResetPasswordService resetPassword) : ControllerBase
    {
        [HttpPost("send-reset-password-email")]
        public async Task<IActionResult> SendResetPasswordEmail([FromBody] ResetPasswordEmailRequestDto req)
        {
            await resetPassword.SendResetPasswordEmail(req.Email);
            return Ok();
        }

        [HttpPost("reset-password")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequestDto req)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await resetPassword.ResetPasswordAsync(req.Token, req.NewPassword);
            if (!result.Success)
            {
                return BadRequest(new { error = result.Error, error_description = result.ErrorDescription });
            }

            return Ok(new { message = "Password reset successfully." });
        }
    }

    public record ResetPasswordEmailRequestDto(
        [Required(ErrorMessage = ValidationConstants.EmailRequired)]
        [RegularExpression(ValidationConstants.EmailPattern, ErrorMessage = ValidationConstants.EmailFormatError)]
        string Email
    );

    public record ResetPasswordRequestDto(
        [Required(AllowEmptyStrings = false, ErrorMessage = ValidationConstants.ResetPasswordTokenRequired)]
        string Token,
        [Required(AllowEmptyStrings = false, ErrorMessage = ValidationConstants.PasswordRequired)]
        string NewPassword
    );
}
