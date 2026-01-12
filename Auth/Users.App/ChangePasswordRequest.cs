using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Users.App
{
    public class ChangePasswordRequest
    {
        public Guid UserId { get; set; }

        public required string NewPassword { get; set; }

        public required string OldPassword { get; set; }

        public bool LockEnabled { get; set; }
    }
}
