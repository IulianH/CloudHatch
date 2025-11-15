using System.ComponentModel.DataAnnotations;

namespace Users.Domain
{
    public class User
    {
        [Key]
        public required Guid Id { get; set; }

        public required string Username { get; set; }
      
        public required string NormalizedUsername { get; set; }

        public required string Password { get; set; }

        public required DateTime CreatedAt { get; set; }

        public DateTime? LockedUntil { get; set; }

        public DateTime? LastLogin { get; set; }

        public bool IsLocked { get; set; }

        public string Roles { get; set; } = string.Empty;
    }
}
