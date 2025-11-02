using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Users.App;
using Users.App.Interface;
using Users.Infra.InMemory;

namespace Users.Infra
{

    public static class InfrastructureRegistration
    {
        public static void RegisterInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IUserRepo, InMemUserRepo>();
           
        }
    }
}
