using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Auth.App;

public static class ApplicationRegistration
{
    public static void RegisterApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddTransient<JwtTokenService, JwtTokenService>();
    }
}