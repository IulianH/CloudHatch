using System;
using System.Collections.Generic;
using System.Text;

namespace Users.Domain
{
    public class SentEmail
    {
        public required Guid Id { get; set; }
        public required Guid UserId { get; set; }
        public required int EmailType { get; set; }
        public required DateTimeOffset SentAt { get; set; }
    }

    public enum SentEmailType
    {
        None = 0,
        Registration,
        PasswordReset
    }
}
