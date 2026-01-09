using System.ComponentModel.DataAnnotations;

namespace Users.Domain
{
    public class User
    {
        [Key]
        public required Guid Id { get; set; }

        public string? Username { get; set; }

        public string? Email { get; set; }

       public string? Name { get; set; }

        public string? Password { get; set; }

        public required DateTimeOffset CreatedAt { get; set; }

        public DateTimeOffset? LockedUntil { get; set; }

        public DateTimeOffset? LastLogin { get; set; }

        public bool IsLocked { get; set; }

        public string? Roles { get; set; }

        public string? ExternalId { get; set;  }

        public required string Issuer { get; set; }
    }
}
