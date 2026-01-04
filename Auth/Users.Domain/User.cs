using System.ComponentModel.DataAnnotations;

namespace Users.Domain
{
    public class User
    {
        [Key]
        public required Guid Id { get; set; }

        public string? Username { get; set; }

        public string? Email { get; set; }
      
        public string? NormalizedUsername { get; set; }

        public string? GivenName {  get; set; }

        public string? FamilyName { get; set; }

        public string? Password { get; set; }

        public required DateTime CreatedAt { get; set; }

        public DateTime? LockedUntil { get; set; }

        public DateTime? LastLogin { get; set; }

        public bool IsLocked { get; set; }

        public string? Roles { get; set; }

        public string? ExternalId { get; set;  }

        public string? Issuer { get; set; }
    }
}
