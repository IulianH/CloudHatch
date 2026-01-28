using Auth.App;
using Auth.Web.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using Users.App;

namespace Auth.Web.Controllers
{
    [ApiController]
    [Route(GlobalConstants.BasePath)]
    public class RegisterController(RegistrationService registration, OriginValidator originValidator, ILogger<RegisterController> logger)
        : ControllerBase
    {
        [HttpPost("web-register")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult> Register([FromBody] RegisterRequestDto req)
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await registration.RegisterAsync(req.Email, req.Password);
            if (!result.Success)
            {
                if (result.Error == "MaxConfirmationEmailsPerDay")
                {
                    return BadRequest(new { error = result.Error, error_description = result.ErrorDescription });
                }
                return BadRequest(new { error = result.Error, error_description = result.ErrorDescription });
            }

            return Ok(new { message = "Registration successful. Please check your email to confirm your account." });
        }

        [HttpPost("confirm-email")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult> ConfirmEmail([FromBody] ConfirmEmailRequestDto req)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "TokenRequired", error_description = ValidationConstants.ConfirmEmailTokenRequired });
            }

            var result = await registration.ConfirmEmailAsync(req.Token);
            if (!result.Success)
            {
                return BadRequest(new { error = result.Error, error_description = result.ErrorDescription });
            }

            return Ok(new { message = "Email confirmed successfully." });
        }

        [HttpPost("send-registration-email")]
        public async Task<IActionResult> SendRegistrationEmail([FromBody] RegistrationEmailRequestDto req)
        {
            await registration.ResendRegistrationEmail(req.Email);
            return Ok();
        }

        private bool IsAllowedOrigin(HttpRequest r) => originValidator.IsAllowedOrigin(r);
    }

    public record RegisterRequestDto(
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        string Email,
        [Required(AllowEmptyStrings = false, ErrorMessage = ValidationConstants.PasswordRequired)]
        [RegularExpression(ValidationConstants.PasswordPattern, ErrorMessage = ValidationConstants.PasswordFormatError)]
        string Password
    );

    public record ConfirmEmailRequestDto(
        [Required(AllowEmptyStrings = false, ErrorMessage = ValidationConstants.ConfirmEmailTokenRequired)]
        string Token
    );

    public record RegistrationEmailRequestDto(
        [Required(ErrorMessage = ValidationConstants.EmailRequired)]
        [RegularExpression(ValidationConstants.EmailPattern, ErrorMessage = ValidationConstants.EmailFormatError)]
        string Email
    );
}
