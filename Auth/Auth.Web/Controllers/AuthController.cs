using Auth.App;
using Auth.App.Env;
using Auth.Web.Configuration;
using Auth.Web.Context;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using Users.App;


namespace Auth.Web.Controllers
{
    [ApiController]
    [Route(GlobalConstants.BasePath)]
    public class AuthController(JwtTokenService auth, LoginService login, ResetPasswordService resetPassword,
        IDataProtectionProvider dp, OriginValidator originValidator, 
        IOptions<AuthCookieOptions> cookieOptions, IOptions<OriginConfig> originConfig, 
        ILogger<AuthController> logger) : ControllerBase
    {
        private readonly AuthCookieOptions _cookieOptions = cookieOptions.Value;
        private readonly OriginConfig _originConfig = originConfig.Value;

        [HttpPost("login")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto req)
        {
            var user = await login.LoginAsync(new LoginRequest(req.Username, req.Password, true));
            if (user == null)
            {
                return Unauthorized();
            }

            if (user.EmailConfirmed == false)
            {
                return Unauthorized(new { error = "EmailNotConfirmed", error_description = "Email address is not confirmed." });
            }

            var token = await auth.IssueTokenAsync(user);

            return Ok(new LoginResponseDto(
                token.AccessToken,
                token.RefreshToken,
                token.ExpiresIn)
                );
        }

        [HttpPost("web-login")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<WebLoginResponseDto>> WebLogin([FromBody] LoginRequestDto req)
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var user = await login.LoginAsync(new LoginRequest(req.Username, req.Password, true));
            if(user == null)
            {
                return Unauthorized();
            }

            if(user.EmailConfirmed == false)
            {
                return Unauthorized(new { error = "EmailNotConfirmed", error_description = "Email address is not confirmed." });
            }

            var token = await auth.IssueTokenAsync(user);

            var protector = CreateProtector();
            IssueCookie(token.RefreshToken, protector);
            await SignOutFederated();
            return Ok(new WebLoginResponseDto(
                token.AccessToken,
                token.ExpiresIn)
            );
        }

        [HttpPost("web-federated-login")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<WebLoginResponseDto>> WebLoginFederated()
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var federatedIdentity = new FederatedIdentity(User);

            if (!federatedIdentity.IsAuthenticated())
            {
                logger.LogError("WebLoginFederated: Received null user identity or not authenticated");
                return Unauthorized();
            }
            var externalId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if(externalId == null)
            {
                logger.LogError("WebLoginFederated: Received null external ID from federated identity");
                return Unauthorized();
            }

            await SignOutFederated();

            var user = await login.LoginFederatedAsync(externalId, true);
            if(user == null)
            {
                return Unauthorized();
            }

            var token = await auth.IssueTokenAsync(user);

            var protector = CreateProtector();
            IssueCookie(token.RefreshToken, protector);
            return Ok(new WebLoginResponseDto(
                token.AccessToken,
                token.ExpiresIn)
            );
        }

        [HttpPost("refresh")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<RefreshResponseDto>> Refresh([FromBody] RefreshRequestDto body)
        {
            var pair = await auth.RefreshTokensAsync(body.RefreshToken);
            if (pair is null) return Unauthorized();

            return Ok(new RefreshResponseDto(
                pair.AccessToken,
                pair.RefreshToken,
                pair.ExpiresIn
            ));
        }

        [HttpPost("web-refresh")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<WebRefreshResponseDto>> WebRefresh()
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var protector = CreateProtector();
            var refreshToken = ReadRefreshTokenFromCookie(protector);
            if (refreshToken == null)
            {
                return Unauthorized();
            }

            var pair = await auth.RefreshTokensAsync(refreshToken);
            if (pair is null)
            {
                return Unauthorized();
            }

            IssueCookie(pair.RefreshToken, protector);
            
            return Ok(new WebRefreshResponseDto(
               pair.AccessToken,
               pair.ExpiresIn
           ));
        }

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


        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto req)
        {
            await auth.RevokeRefreshTokenAsync(req.RefreshToken, req.LogoutAll);
            return NoContent();
        }

        [HttpPost("web-logout")]
        public async Task<IActionResult> WebLogout([FromBody] WebLogoutRequestDto req)
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            await SignOutFederated();
            var refreshToken = ReadRefreshTokenFromCookie(CreateProtector());
            if (refreshToken == null)
            {
                return NoContent();
            }

            await auth.RevokeRefreshTokenAsync(refreshToken, req.LogoutAll);
            DeleteCookie();

            return NoContent();
        }

        private async Task SignOutFederated()
        {
            var federatedIdentity = new FederatedIdentity(User);
            if (federatedIdentity.IsAuthenticated())
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        }

        [HttpGet("web-google-challenge")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public IActionResult WebGoogleLogin()
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            return Challenge(
             new AuthenticationProperties
             {
                 RedirectUri = $"{_originConfig.FederationSuccessAbsoluteUrl}"
             },
             "Google");
        }

        [HttpGet("web-microsoft-challenge")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public IActionResult WebMicrosoftLogin([FromQuery] string? returnUrl = null)
        {
            if (!IsAllowedOrigin(Request))
            {
                logger.LogWarning(originValidator.Error);
                return Forbid();  // simple CSRF guard 
            }

            var props = new AuthenticationProperties
            {
                RedirectUri = $"{_originConfig.FederationSuccessAbsoluteUrl}" +
                              (returnUrl is null ? "" : $"?returnUrl={Uri.EscapeDataString(returnUrl)}")
            };
            return Challenge(props, "Microsoft");
        }

        private string? ReadRefreshTokenFromCookie(IDataProtector protector)
        {
            if (!Request.Cookies.TryGetValue(_cookieOptions.Name, out var protectedValue))
            {
                return null;
            }

            string json;
            try
            {
                json = protector.Unprotect(protectedValue);
            }
            catch (CryptographicException)
            {
                logger.LogWarning("Failed to unprotect refresh token");
                return null;
            }
            var dto = System.Text.Json.JsonSerializer.Deserialize<RefreshDto>(json);
            return dto!.rt;
        }

        private IDataProtector CreateProtector() => dp.CreateProtector("Tokens.Cookie:v1");

        private bool IsAllowedOrigin(HttpRequest r) => originValidator.IsAllowedOrigin(r);

        private void IssueCookie(string refreshToken, IDataProtector dp)
        {
            var newJson = System.Text.Json.JsonSerializer.Serialize(new { rt = refreshToken, v = 1 });
            var newProtected = dp.Protect(newJson);

            Response.Cookies.Append(_cookieOptions.Name, newProtected, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = GlobalConstants.BasePath,
                MaxAge = TimeSpan.FromHours(_cookieOptions.MaxAgeHours),
                Domain = _originConfig.Host
            });
        }
        
        private void DeleteCookie()
        {
            Response.Cookies.Delete(_cookieOptions.Name, new CookieOptions
            {
                Path = GlobalConstants.BasePath,
                Domain = _originConfig.Host
            });
        }
    }

    record RefreshDto(string rt, int v);

    public record LoginRequestDto(
        [Required(ErrorMessage = ValidationConstants.UsernameRequired)]
        [RegularExpression(ValidationConstants.EmailPattern, ErrorMessage = ValidationConstants.EmailFormatError)]
        string Username,
        [Required(AllowEmptyStrings = false, ErrorMessage = ValidationConstants.PasswordRequired)]
        string Password
    );

    public record WebLoginResponseDto(
        string AccessToken,
        int ExpiresIn
    );

    public record LoginResponseDto(
        string AccessToken,
        string RefreshToken,
        int ExpiresIn

    ) : WebLoginResponseDto(AccessToken, ExpiresIn);

    public record RefreshRequestDto(
        [Required(AllowEmptyStrings = false)]
        string RefreshToken
    );

    public record WebRefreshResponseDto(
        string AccessToken,
        int ExpiresIn
    );

    public record RefreshResponseDto(
        string AccessToken,
        string RefreshToken,
        int ExpiresIn

    ) : WebRefreshResponseDto(AccessToken, ExpiresIn);

    public record WebLogoutRequestDto(
        bool LogoutAll
    );

    public record LogoutRequestDto(
        [Required(AllowEmptyStrings = false)]
        string RefreshToken,
        bool LogoutAll
    ) : WebLogoutRequestDto(LogoutAll);

    public record IdentityInfoResponse(
        string? Idp,
        string? Name,
        string? Email
    );

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
