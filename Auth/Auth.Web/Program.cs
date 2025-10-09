using Auth.App;
using Auth.App.Interface.RefreshToken;
using Auth.Infra;
using Auth.Web.Middleware;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

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

Console.WriteLine($"Starting Auth.Web in {app.Environment.EnvironmentName}");
app.Run();
