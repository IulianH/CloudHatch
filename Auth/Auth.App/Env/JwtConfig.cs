using System.ComponentModel.DataAnnotations;

namespace Auth.App.Env
{
    public class JwtConfig
    {
        [Required(AllowEmptyStrings = false, ErrorMessage = "JWT Key is required and cannot be empty.")]
        public string Key { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "JWT Issuer is required and cannot be empty.")]
        public string Issuer { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "JWT Audience is required and cannot be empty.")]
        public string Audience { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "JWT ExpiresInSeconds must be a positive value.")]
        public int ExpiresInSeconds { get; set; }
    }
}
