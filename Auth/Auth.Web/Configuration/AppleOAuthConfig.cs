using System.ComponentModel.DataAnnotations;

namespace Auth.App.Env
{
    public class AppleOAuthConfig
    {
        public bool Enabled { get; set; }

        [Required(AllowEmptyStrings = false, ErrorMessage = "Apple ClientId (Service ID) is required.")]
        public string ClientId { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "Apple Team ID is required.")]
        public string TeamId { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "Apple Key ID is required.")]
        public string KeyId { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "Apple Private Key is required.")]
        public string PrivateKey { get; set; } = string.Empty;
    }
}

