using System.ComponentModel.DataAnnotations;

namespace Auth.App.Env
{
    public class MicrosoftOAuthConfig
    {
        public bool Enabled { get; set; }

        public string ClientId { get; set; } = string.Empty;

        public string ClientSecret { get; set; } = string.Empty;
    }
}

