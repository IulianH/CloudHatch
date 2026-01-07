using Auth.App.Interface.RefreshToken;
using Auth.Infra.RefreshToken.InMemory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Users.App.Interface;
using Users.Infra.InMemory;

namespace Auth.Infra
{
    public static class InfrastructureRegistration
    {
        public static void RegisterInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IRefreshTokenRepository, InMemoryRefreshTokenRepository>();
            services.AddSingleton<IUserRepo, InMemUserRepo>();
        }
    }
}
