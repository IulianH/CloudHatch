using System.ComponentModel.DataAnnotations;

namespace Auth.App
{
    public record InternalUser
    {
        [Key]
        public required Guid Id { get; set; }

        public required string Username { get; set; }

        public required string Password { get; set; }

        public required DateTime CreatedAt { get; set; }

        public User ToHarborUser() => new User
        { CreatedAt = CreatedAt, Id = Id.ToString(), Username = Username };
    }
}
