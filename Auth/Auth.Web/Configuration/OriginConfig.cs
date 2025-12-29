using System.ComponentModel.DataAnnotations;

namespace Auth.Web.Configuration
{
    public class OriginConfig
    {
        private string _path = string.Empty;
        private string _host = string.Empty;
        private string _federationSuccessPath = string.Empty;
        private short _port = 0;

        [Required(AllowEmptyStrings = false, ErrorMessage = "Origin:Host cannot be Empty.")]
        public required string Host
        {
            get { return _host; }

            set => _host = value?.Trim() ?? string.Empty;
        }
        public short Port
        {
            get;
            set;
        }
        public string Path
        {
            get { return _path; }
            set => _path = value?.Trim() ?? string.Empty;
        }

        public string FederationSuccessPath
        {
            get { return _federationSuccessPath; }
            set => _federationSuccessPath = value?.Trim() ?? string.Empty;
        }

        public string HostWithScheme => $"https://{Host}{PortPart}";

        public string HostWithSchemeAndPath => $"{HostWithScheme}{Path}";

        public string FederationSuccessAbsoluteUrl => $"{HostWithScheme}{FederationSuccessPath}";

        private string PortPart => Port <= 0 || Port == 80 ? string.Empty : $":{Port}";
    }
}
