namespace Auth.App.Interface.Users
{
    public record User
    {
        public required Guid Id { get; init; }

        public required string Username { get; init; }

        public required DateTime CreatedAt { get; init; }
    }
}
