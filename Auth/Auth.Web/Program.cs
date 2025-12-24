using Auth.App;
using Auth.App.Env;
using Auth.App.Interface.RefreshToken;
using Auth.Infra;
using Auth.Web.Configuration;
using Auth.Web.Extensions;
using Auth.Web.Middleware;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;
using StackExchange.Redis;
using Users.App.Interface;


var builder = WebApplication.CreateBuilder(args);

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

// Add OpenAPI services with Scalar transformers
builder.Services.AddOpenApi(options => options.AddScalarTransformers());

// Configure Google OAuth
var googleConfig = builder.Configuration.GetSection("Google").Get<GoogleOAuthConfig>();
if (googleConfig != null && !string.IsNullOrEmpty(googleConfig.ClientId) && !string.IsNullOrEmpty(googleConfig.ClientSecret))
{
    builder.Services.AddAuthentication()
        .AddCookie("TempCookie") // Temporary cookie scheme for OAuth flow
        .AddGoogle("Google", options =>
        {
            options.ClientId = googleConfig.ClientId;
            options.ClientSecret = googleConfig.ClientSecret;
            options.CallbackPath = googleConfig.CallbackPath;
            options.Scope.Add("email");
            options.Scope.Add("profile");
            options.SaveTokens = false;
            // Use temp cookie scheme - ticket will be available via AuthenticateAsync("Google")
            options.SignInScheme = "TempCookie";
            // Prevent automatic redirect after callback
            options.Events.OnTicketReceived = context =>
            {
                // Clear the ReturnUrl to prevent automatic redirect
                // The ticket will be signed in to TempCookie scheme
                // Controller can retrieve it via AuthenticateAsync("Google") which will
                // return the ticket from the TempCookie
                context.Properties.RedirectUri = null;
                return Task.CompletedTask;
            };
        });
}

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
if (app.Environment.IsDevelopment())
{
    // Add OpenAPI document generation
    app.MapOpenApi();
    
    // Add Scalar UI for API documentation
    app.MapScalarApiReference();
}


// Add global exception handling for Token library exceptions
app.UseMiddleware<UnhandledExceptionMiddleware>();


app.MapControllers();

app.Services.GetRequiredService<IRefreshTokenRepository>().Migrate();
app.Services.GetRequiredService<IUserRepo>().Migrate();
Console.WriteLine($"Starting Auth.Web in {app.Environment.EnvironmentName}");
app.Run();
