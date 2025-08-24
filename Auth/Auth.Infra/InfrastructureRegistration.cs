using Auth.App;
using Auth.Infra.RefreshToken.InMemory;
using Auth.Infra.Users.InMemory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Auth.Infra
{
    public static class InfrastructureRegistration
    {
        public static void RegisterInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IUserService, InMemoryUserService>();
            services.AddSingleton<IRefreshTokenRepository, InMemoryRefreshTokenRepository>();
        }
    }
}
