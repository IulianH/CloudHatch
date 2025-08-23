namespace Auth.App
{
    public record TokenPair(
     string AccessToken,
     string RefreshToken,
     int ExpiresInSeconds
 );
}
