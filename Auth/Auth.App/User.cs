using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Auth.App
{
    public record User
    {
        public required string Id { get; set; }

        public required string Username { get; set; }

        public required DateTime CreatedAt { get; set; }
    }
}
