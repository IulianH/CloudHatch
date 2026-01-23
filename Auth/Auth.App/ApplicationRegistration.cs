using Auth.App.Env;
using Auth.App.Interface.RefreshToken;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Users.App;
using Users.App.Settings;

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

        services.AddOptions<RtConfig>()
            .Bind(configuration.GetSection("Rt"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<LoginSettings>()
            .Bind(configuration.GetSection("Login"));

        services.AddOptions<RegistrationEmailSettings>()
            .Bind(configuration.GetSection("RegistrationEmail"));

        services.AddOptions<RegisterSettings>()
            .Bind(configuration.GetSection("Register"));

        services.AddOptions<ResetPasswordEmailSettings>()
            .Bind(configuration.GetSection("ResetPasswordEmail"));

        services.AddOptions<ResetPasswordSettings>()
            .Bind(configuration.GetSection("ResetPassword"));

        services.AddTransient<JwtTokenService>();
        services.AddTransient<RefreshTokenService>();
        services.AddTransient<LoginService>();
        services.AddTransient<RegistrationService>();
        services.AddTransient<ResetPasswordService>();
        services.AddTransient<ChangePasswordService>();
    }
}