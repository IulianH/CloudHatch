namespace Auth.App
{
    public record User
    {
        public required string Id { get; set; }

        public required string Username { get; set; }

        public required DateTime CreatedAt { get; set; }
    }
}
