using Auth.App.Exceptions;
using Auth.App.Interface.RefreshToken;
using Auth.App.Interface.Users;
using Auth.Infra.RefreshToken.InMemory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Auth.Infra
{
    public static class InfrastructureRegistration
    {
        public static void RegisterInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IRefreshTokenRepository, InMemoryRefreshTokenRepository>();
            services.AddHttpClient<IUserService,UserService>(client =>
            {
                var baseUrl = configuration["UserServiceBaseUrl"];
                if(baseUrl == null)
                {
                    throw new AppException("UserServiceBaseUrl is not set");
                }
                client.BaseAddress = new Uri(baseUrl!);
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            });
        }
    }
}
