using Auth.App.Internal;
using Auth.App.Internal.Repository;
using Auth.App.Internal.Repository.Impl;
using Auth.App.Internal.Repository.Impl.RefreshToken;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Auth.App
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddTokenHarborJwtTokenService(this IServiceCollection services, IConfiguration configuration)
        {
            AddUserService(services, configuration);
            AddRefreshTokenRepository(services, configuration);
            services.AddSingleton<IJwtTokenService, JwtTokenService>();
            return services;
        }

        private static void AddUserService(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IUserService,InMemoryUserService>();
        }

        private static void AddRefreshTokenRepository(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IRefreshTokenRepository, InMemoryRefreshTokenRepository>();
        }
    }
}
