using Microsoft.Extensions.Options;

namespace Auth.Web.Configuration
{
    public class OriginValidator(IOptions<OriginConfig> originConfig)
    {
        private readonly OriginConfig _originConfig = originConfig.Value;

        public bool IsAllowedOrigin(HttpRequest r)
        {
            var origin = GetOrigin(r);
            if(origin == null)
            {
                Error = "Empty origin received";
                return false;
            }

            var allowed = origin == _originConfig.Host;
            if(!allowed)
            {
                Error = $"Origin {origin} is not in the allowed list";
            }

            return allowed;
        }

        private string? GetOrigin(HttpRequest r)
        {
            var origin = r.Headers.Host.ToString()?.ToLower()?.Trim();
            if (string.IsNullOrEmpty(origin))
            {
                return null;
            }
            return origin;
        }

        public string Error { get; private set; } = string.Empty;
    }
}
