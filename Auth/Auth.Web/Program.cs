using Auth.App;
using Auth.App.Interface.RefreshToken;
using Auth.Infra;
using Auth.Web.Middleware;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.OpenApi;
using Scalar.AspNetCore;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Add OpenAPI services with Scalar transformers
builder.Services.AddOpenApi(options => options.AddScalarTransformers());

builder.Services.RegisterApplication(builder.Configuration);

builder.Services.RegisterInfrastructure(builder.Configuration);

// Add CORS for the development environment if enabled in configuration
var corsEnabled = builder.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("EnableCors");
if (corsEnabled)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DevelopmentPolicy", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });
}

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
    
    // Enable CORS for development if enabled in configuration
    if (corsEnabled)
    {
        app.UseCors("DevelopmentPolicy");
    }
}

// No need when running in a container
//app.UseHttpsRedirection();

// Add global exception handling for Token library exceptions
app.UseMiddleware<UnhandledExceptionMiddleware>();


app.MapControllers();

app.Services.GetRequiredService<IRefreshTokenRepository>().Migrate();

app.Run();
