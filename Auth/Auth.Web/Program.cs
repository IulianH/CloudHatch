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

    options.CallbackPath = "/web-google-callback";

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
                "https://localhost:5100/api/auth/web-google-callback";
            return Task.CompletedTask;
        }
    };
    options.CorrelationCookie.Path = "/";
    options.NonceCookie.Path = "/";

    options.CorrelationCookie.SameSite = SameSiteMode.None;
    options.NonceCookie.SameSite = SameSiteMode.None;

    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
    options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
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
fwd.KnownProxies.Clear();


var logger = app.Services.GetRequiredService<ILogger<Program>>();

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
