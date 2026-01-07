using Users.Domain;

namespace Auth.App
{
    public record TokenPair(
     string AccessToken,
     string RefreshToken,
     int ExpiresIn,
     User User
 );
}
