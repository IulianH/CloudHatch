using Auth.App.Interface.Users;

namespace Auth.App
{
    public record TokenPair(
     string AccessToken,
     string RefreshToken,
     DateTime ExpiresAt,
     User User
 );
}
