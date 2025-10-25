using Auth.App.Interface.Users;

namespace Auth.App
{
    public record TokenPair(
     string AccessToken,
     string RefreshToken,
     int ExpiresIn,
     User User
 );
}
