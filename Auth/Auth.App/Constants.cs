using System;
using System.Collections.Generic;
using System.Text;

namespace Auth.App
{
    public static class Constants
    {
        private static readonly string[] issuers = ["apple", "google", "microsoft"];
        public static string GetIdp(string? issuer)
        {
            if (issuer == null)
            {
                return "local";
            }
            var idp = issuers.FirstOrDefault(x => issuer.Contains(x, StringComparison.InvariantCultureIgnoreCase));
            return idp ?? "local";
        }
    }
}
