using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Auth.App
{
    public static class Constants
    {
        public static readonly string GoogleIdp = "google";
        public static readonly string AppleIdp = "apple";
        public static readonly string MicrosoftIdp = "microsoft";

        private static readonly string[] issuers = [AppleIdp, GoogleIdp, MicrosoftIdp];
        public static string GetIdp(string issuer)
        {
            var idp = issuers.FirstOrDefault(x => issuer.Contains(x, StringComparison.InvariantCultureIgnoreCase));
            return idp ?? issuer;
        }
    }
}
