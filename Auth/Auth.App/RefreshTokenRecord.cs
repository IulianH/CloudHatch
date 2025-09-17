using System.ComponentModel.DataAnnotations;

namespace Auth.App
{
    public class RefreshTokenRecord
    {
        [Key] 
        public string Token { get; set; } = default!;

        public Guid UserId { get; set; } = default!;

        public string SessionId { get; set; } = Guid.NewGuid().ToString("N"); // one per device/login

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }

        public DateTime? RevokedAt { get; set; }   
        // set on rotation or logout
        public string? ReplacedByHash { get; set; }            // points to the next RT in the chain

        public bool Compromised { get; set; }            // set if reuse detected
    }
}
