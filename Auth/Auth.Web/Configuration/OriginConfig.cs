using System.ComponentModel.DataAnnotations;

namespace Auth.Web.Configuration
{
    public class OriginConfig
    {
        private string _host = string.Empty;
        private string _federationSuccessPath = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "Origin:Host cannot be Empty.")]
        public required string Host
        {
            get { return _host; }

            set => _host = value?.Trim() ?? string.Empty;
        }

        public string FederationSuccessPath
        {
            get { return _federationSuccessPath; }
            set => _federationSuccessPath = value?.Trim() ?? string.Empty;
        }

        public string HostWithScheme => $"https://{Host}";

        public string FederationSuccessAbsoluteUrl => $"{HostWithScheme}{FederationSuccessPath}";

        public string HostWithSchemeWithBasePath => $"{HostWithScheme}{GlobalConstants.BasePath}";
    }
}
