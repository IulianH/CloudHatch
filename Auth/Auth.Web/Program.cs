using Auth.App;
using Auth.App.Env;
using Auth.App.Interface.RefreshToken;
using Auth.Infra;
using Auth.Web.Configuration;
using Auth.Web.Extensions;
using Auth.Web.Middleware;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using StackExchange.Redis;
using Users.App.Interface;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = "Google";
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    // Temporary cookie used only during external login
    options.Cookie.Name = "__Host.external";
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
})
.AddOpenIdConnect("Google", options =>
{
    options.Authority = "https://accounts.google.com";
    options.ClientId = builder.Configuration["Google:ClientId"];
    options.ClientSecret = builder.Configuration["Google:ClientSecret"];

    options.CallbackPath = "/api/auth/web-google-callback";

    options.ResponseType = OpenIdConnectResponseType.Code;
    options.UsePkce = true;

    options.Scope.Clear();
    options.Scope.Add("openid");
    options.Scope.Add("email");
    options.Scope.Add("profile");

    options.SaveTokens = false;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role"
    };

    options.Events = new OpenIdConnectEvents
    {
        OnTokenValidated = ctx =>
        {
            var sub = ctx.Principal!.FindFirst("sub")?.Value;
            var email = ctx.Principal.FindFirst("email")?.Value;

            // Here you will:
            // 1. Link or create local user
            // 2. Issue your own tokens
            // 3. Redirect back to SPA

            return Task.CompletedTask;
        },

        OnRedirectToIdentityProvider = ctx =>
        {
            // Ensures correct https redirect behind Nginx
            ctx.ProtocolMessage.RedirectUri =
                "https://localhost:5001/api/auth/web-google-callback";
            return Task.CompletedTask;
        }
    };
});

var redisConn = builder.Configuration["REDIS:CONNECTION"]!; // from compose env

var mux = ConnectionMultiplexer.Connect(redisConn);
// Persist Data Protection keys only to Redis
builder.Services.AddDataProtection()
    .SetApplicationName("cloudhatch") // important for sharing across instances
    .PersistKeysToStackExchangeRedis(mux, "DataProtection-Keys");

// Add services to the container.

builder.Services.AddControllers();

builder.Services.AddTransient<OriginValidator>();

// Configure AuthCookie options
builder.Services.Configure<AuthCookieOptions>(builder.Configuration.GetSection("AuthCookie"));

// Configure Google OAuth options
builder.Services.Configure<GoogleOAuthConfig>(builder.Configuration.GetSection("Google"));


// Google OAuth is now handled manually in the controller
// No need for AddGoogle or TempCookie - the controller implements the full OAuth flow

builder.Services.RegisterApplication(builder.Configuration);

builder.Services.RegisterInfrastructure(builder.Configuration);

var app = builder.Build();

// IMPORTANT: do this early, before auth/routing/etc.
var fwd = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedHost
};
// If running in containers, Kestrel may not recognize the proxy by default:
fwd.KnownNetworks.Clear();
fwd.KnownProxies.Clear();

// Harden security: Only accept forwarded headers from the private Docker network
// Since the 'private' network is internal: true, only containers on that network
// can reach this service. This is secure because:
// 1. The network is isolated (internal: true)
// 2. Only nginx reverse-proxy forwards headers to this service
// 3. Other containers on the network can't spoof headers because they don't proxy
var privateNetworkSubnet = builder.Configuration["DOCKER_PRIVATE_NETWORK_SUBNET"] ?? "172.20.0.0/16";
var logger = app.Services.GetRequiredService<ILogger<Program>>();

try
{
    // Parse CIDR notation (e.g., "172.20.0.0/16")
    var parts = privateNetworkSubnet.Split('/');
    if (parts.Length == 2 && 
        System.Net.IPAddress.TryParse(parts[0], out var networkAddress) &&
        int.TryParse(parts[1], out var prefixLength) &&
        prefixLength >= 0 && prefixLength <= 128)
    {
        var network = new Microsoft.AspNetCore.HttpOverrides.IPNetwork(networkAddress, prefixLength);
        fwd.KnownNetworks.Add(network);
        logger.LogInformation("Configured forwarded headers to trust network: {Subnet}", privateNetworkSubnet);
    }
    else
    {
        logger.LogError("Invalid DOCKER_PRIVATE_NETWORK_SUBNET format: {Subnet}. Expected format: IP/PrefixLength (e.g., 172.20.0.0/16). Forwarded headers will be insecure!", privateNetworkSubnet);
    }
}
catch (Exception ex)
{
    logger.LogError(ex, "Failed to parse DOCKER_PRIVATE_NETWORK_SUBNET: {Subnet}. Forwarded headers will be insecure!", privateNetworkSubnet);
}

app.UseForwardedHeaders(fwd);

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.


// Add global exception handling for Token library exceptions
app.UseMiddleware<UnhandledExceptionMiddleware>();


app.MapControllers();

app.Services.GetRequiredService<IRefreshTokenRepository>().Migrate();
app.Services.GetRequiredService<IUserRepo>().Migrate();
Console.WriteLine($"Starting Auth.Web in {app.Environment.EnvironmentName}");
app.Run();
