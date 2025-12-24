using Auth.App.Env;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Users.App;

namespace Auth.App;

public static class ApplicationRegistration
{
    public static void RegisterApplication(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure JWT options with validation
        services.AddOptions<JwtConfig>()
            .Bind(configuration.GetSection("Jwt"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddTransient<JwtTokenService>();
        services.AddTransient<LoginService>();
        services.AddTransient<GoogleOAuthService>();

        // Configure Google OAuth options with validation
        services.AddOptions<GoogleOAuthConfig>()
            .Bind(configuration.GetSection("Google"))
            .ValidateDataAnnotations()
            .ValidateOnStart();
    }
}