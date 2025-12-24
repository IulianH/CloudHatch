using System.ComponentModel.DataAnnotations;

namespace Auth.App.Env
{
    public class GoogleOAuthConfig
    {
        [Required(AllowEmptyStrings = false, ErrorMessage = "Google ClientId is required and cannot be empty.")]
        public string ClientId { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "Google ClientSecret is required and cannot be empty.")]
        public string ClientSecret { get; set; } = string.Empty;

        public string CallbackPath { get; set; } = "/google-callback";
    }
}

