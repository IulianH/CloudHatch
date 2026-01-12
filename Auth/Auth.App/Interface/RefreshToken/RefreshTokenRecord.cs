using System.ComponentModel.DataAnnotations;

namespace Auth.App.Interface.RefreshToken
{
    public class RefreshTokenRecord
    {
        [Key] 
        public required string Token { get; init; }

        public required Guid UserId { get; init; } 

        public required DateTimeOffset SessionCreatedAt { get; set; } 

        public required DateTimeOffset ExpiresAt { get; init; }

        public int Index { get; set; }
    }
}
