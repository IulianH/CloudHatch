using System;
using System.Collections.Generic;
using System.Text;

namespace Users.App
{
    public class FederatedUser
    {
        public required string Id { get; set; }

        public required string Issuer { get; set; }

        public string? Name { get; set; }

        public string? Email { get; set; }

        public string? Username { get; set; }
    }
}
