namespace Auth.Web.Extensions;

public class AuthCookieOptions
{
    public string Name { get; set; } = string.Empty;
    public int MaxAgeHours { get; set; }
    public string Domain { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
}

