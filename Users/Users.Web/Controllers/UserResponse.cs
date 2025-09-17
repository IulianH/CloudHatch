namespace Users.Web.Controllers
{
    public class UserResponse
    {
        public required string Username { get; set; }
        public required Guid Id { get; set; }
        public required DateTime CreatedAt { get; set; }
    }
}
