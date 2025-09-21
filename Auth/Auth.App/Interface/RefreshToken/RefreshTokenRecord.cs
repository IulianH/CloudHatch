using System.ComponentModel.DataAnnotations;

namespace Auth.App.Interface.RefreshToken
{
    public class RefreshTokenRecord
    {
        [Key] 
        public string Token { get; init; } = null!;

        public Guid UserId { get; init; } = Guid.Empty!;

        public string SessionId { get; set; } = Guid.NewGuid().ToString("N"); // one per device/login

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; init; }

        public DateTime? RevokedAt { get; set; }   
        // set on rotation or logout
        public string? ReplacedByHash { get; set; }            // points to the next RT in the chain

        public bool Compromised { get; set; }            // set if reuse detected
    }
}
