using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Users.App;

namespace Auth.App;

public static class ApplicationRegistration
{
    public static void RegisterApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddTransient<JwtTokenService>();
        services.AddTransient<LoginService>();

    }
}