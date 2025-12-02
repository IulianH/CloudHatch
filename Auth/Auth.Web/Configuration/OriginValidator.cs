using Auth.App.Exceptions;

namespace Auth.Web.Configuration
{
    public class OriginValidator(IConfiguration config)
    {
        private readonly string[] _allowedOrigins = config["AllowedOrigins"]?.ToLower().Split(',', StringSplitOptions.RemoveEmptyEntries)
            ?? throw new AppException("No \"AllowedOrigins\" config key found");

        public bool IsAllowedOrigin(HttpRequest r)
        {
            if (_allowedOrigins.Length == 0)
            {
                return true;
            }

            var origin = GetOrigin(r);
            if(origin == null)
            {
                Error = "Empty origin received";
                return false;
            }

            var allowed = _allowedOrigins.Any(x => origin == $"https://{x.Trim()}");
            if(!allowed)
            {
                Error = $"Oringin {origin} is not in the allowed list";
            }

            return allowed;
        }

        private string? GetOrigin(HttpRequest r)
        {
            var origin = r.Headers.Origin.ToString()?.ToLower()?.Trim();
            if (string.IsNullOrEmpty(origin))
            {
                return null;
            }
            return origin;
        }

        public string Error { get; private set; } = string.Empty;
    }
}
