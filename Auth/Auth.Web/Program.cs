using Auth.App;
using Auth.App.Env;
using Auth.App.Interface.RefreshToken;
using Auth.Infra;
using Auth.Web;
using Auth.Web.Configuration;
using Auth.Web.Middleware;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using Users.App.Interface;

var builder = WebApplication.CreateBuilder(args);
const string originSectionName = "Origin";

builder.Services.AddOptions<OriginConfig>()
    .Bind(builder.Configuration.GetSection(originSectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

const string googleSectionName = "GoogleOAuth";
builder.Services.Configure<GoogleOAuthConfig>(builder.Configuration.GetSection(googleSectionName));
var googleConfig = builder.Configuration.GetSection(googleSectionName).Get<GoogleOAuthConfig>();


bool hasFederatedAuthentication = false;
bool hasGoogleAuthentication = false; 
hasFederatedAuthentication = hasGoogleAuthentication = googleConfig?.Enabled ?? false;

if (hasGoogleAuthentication)
{ 
    if(string.IsNullOrWhiteSpace(googleConfig?.ClientId) || string.IsNullOrWhiteSpace(googleConfig?.ClientSecret))
    {
        throw new ApplicationException("Google credentials not provided");
    }
    var originConfig = builder.Configuration.GetSection(originSectionName).Get<OriginConfig>();

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
        options.ClientId = googleConfig?.ClientId;
        options.ClientSecret = googleConfig?.ClientSecret;

        options.CallbackPath = $"{GlobalConstants.BasePath}/web-google-callback";

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
                return Task.CompletedTask;
            },
            OnRedirectToIdentityProvider = ctx =>
            {
                // Ensures correct https redirect behind Nginx
                ctx.ProtocolMessage.RedirectUri = $"{originConfig?.HostWithScheme}{GlobalConstants.BasePath}/web-google-callback";
                return Task.CompletedTask;
            }
        };
        options.CorrelationCookie.Path = GlobalConstants.BasePath;
        options.NonceCookie.Path = GlobalConstants.BasePath;

        options.CorrelationCookie.SameSite = SameSiteMode.None;
        options.NonceCookie.SameSite = SameSiteMode.None;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
        options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
    });
}

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

builder.Services.RegisterApplication(builder.Configuration);

builder.Services.RegisterInfrastructure(builder.Configuration);

var app = builder.Build();

// IMPORTANT: do this early, before auth/routing/etc.
var fwd = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedHost
};
// If running in containers, Kestrel may not recognize the proxy by default:
fwd.KnownProxies.Clear();


var logger = app.Services.GetRequiredService<ILogger<Program>>();

app.UseForwardedHeaders(fwd);

if (hasFederatedAuthentication)
{
    // Add authentication and authorization middleware
    app.UseAuthentication();
    app.UseAuthorization();
}

// Configure the HTTP request pipeline.


// Add global exception handling for Token library exceptions
app.UseMiddleware<UnhandledExceptionMiddleware>();


app.MapControllers();

app.Services.GetRequiredService<IRefreshTokenRepository>().Migrate();
app.Services.GetRequiredService<IUserRepo>().Migrate();
Console.WriteLine($"Starting Auth.Web in {app.Environment.EnvironmentName}");
app.Run();
