namespace Auth.App.Interface.Users
{
    public record User
    {
        public required Guid Id { get; init; }

        public required string Username { get; init; }

        public required string UserEmail { get; init; }

        public string? GivenName { get; init; }

        public string? FamilyName { get; init; }

        public required string[] Roles { get; init; }

        public required DateTime CreatedAt { get; init; }

        public string GetName()
        {
            var name = $"{GivenName ?? string.Empty} {FamilyName ?? string.Empty}";
            if(!string.IsNullOrWhiteSpace(name))
            {
                return name.Trim();
            }
            return UserEmail ?? Username;
        }
    }
}
