using Microsoft.AspNetCore.Mvc;
using System;
using System.ComponentModel.DataAnnotations;
using Users.App;

namespace Auth.Web.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ChangePasswordController(ChangePasswordService changePasswordService) : ControllerBase
    {
        [HttpPut]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await changePasswordService.ChangePasswordAsync(new ChangePasswordRequest
            {
                UserId = request.UserId,
                OldPassword = request.OldPassword,
                NewPassword = request.NewPassword,
                LockEnabled = true
            });

            if (!result.Success)
            {
                return result.Error switch
                {
                    "UserNotFound" => NotFound(new { error = result.Error, error_description = result.ErrorDescription }),
                    "InvalidOldPassword" => Unauthorized(new { error = result.Error, error_description = result.ErrorDescription }),
                    "AccountLocked" => Forbid(),
                    "InvalidAccountType" => BadRequest(new { error = result.Error, error_description = result.ErrorDescription }),
                    "InvalidPasswordFormat" => BadRequest(new { error = result.Error, error_description = result.ErrorDescription }),
                    _ => BadRequest(new { error = result.Error ?? "ChangePasswordFailed", error_description = result.ErrorDescription })
                };
            }

            return Ok(new { message = "Password changed successfully." });
        }
    }

    public record ChangePasswordRequestDto(
        [Required(ErrorMessage = "User ID is required.")]
        Guid UserId,
        [Required(AllowEmptyStrings = false, ErrorMessage = ValidationConstants.PasswordRequired)]
        string OldPassword,
        [Required(AllowEmptyStrings = false, ErrorMessage = ValidationConstants.PasswordRequired)]
        [RegularExpression(ValidationConstants.PasswordPattern, ErrorMessage = ValidationConstants.PasswordFormatError)]
        string NewPassword
    );
}
