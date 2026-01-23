using System;
using System.Collections.Generic;
using System.Text;

namespace Users.App
{
    internal static class Constants
    {
        public const string LocalAccount = "local";

        public static bool IsLocalAccount(string issuer)
        {
            return string.Equals(issuer, LocalAccount, StringComparison.InvariantCultureIgnoreCase);
        }
    }
}
