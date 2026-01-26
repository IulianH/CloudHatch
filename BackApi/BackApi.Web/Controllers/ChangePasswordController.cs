using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.ComponentModel.DataAnnotations;
using Users.App;

namespace BackApi.Web.Controllers
{
    [Route("/")]
    public class ChangePasswordController(ChangePasswordService changePasswordService) : ControllerBase
    {
        [Authorize]
        [HttpPut("changepassword")]
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

    internal static class Validation
    {
        public const string PasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$";
        public const string PasswordFormatError = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    }

    public record ChangePasswordRequestDto(
        [Required(ErrorMessage = "User ID is required.")]
        Guid UserId,
        [Required(AllowEmptyStrings = false, ErrorMessage = "Old password is required")]
        string OldPassword,
        [Required(AllowEmptyStrings = false, ErrorMessage = "New password is required")]
        [RegularExpression(Validation.PasswordPattern, ErrorMessage = Validation.PasswordFormatError)]
        string NewPassword
    );
}
