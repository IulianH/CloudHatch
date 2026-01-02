namespace Auth.Web.Configuration;

public class AuthCookieOptions
{
    public string Name { get; set; } = string.Empty;
    public int MaxAgeHours { get; set; }
}

