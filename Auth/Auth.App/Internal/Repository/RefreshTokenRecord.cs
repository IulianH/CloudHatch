using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Auth.App.Internal.Repository
{
    public class RefreshTokenRecord
    {
        [Key] 
        public string Token { get; set; } = default!;

        public string UserId { get; set; } = default!;

        public DateTime ExpiresAt { get; set; }
    }
}
