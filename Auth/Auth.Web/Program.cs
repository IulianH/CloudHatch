using Auth.App;
using Auth.App.Interface.RefreshToken;
using Auth.Infra;
using Auth.Web.Configuration;
using Auth.Web.Extensions;
using Auth.Web.Middleware;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
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

builder.Services.RegisterApplication(builder.Configuration);

builder.Services.RegisterInfrastructure(builder.Configuration);

var app = builder.Build();

// IMPORTANT: do this early, before auth/routing/etc.
var fwd = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
};
// If running in containers, Kestrel may not recognize the proxy by default:
fwd.KnownNetworks.Clear();
fwd.KnownProxies.Clear();

app.UseForwardedHeaders(fwd);

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
