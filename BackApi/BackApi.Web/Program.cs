using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// JWT bearer auth: validate tokens issued by the Auth service
var issuer = builder.Configuration["Jwt:Issuer"];
var audience = builder.Configuration["Jwt:Audience"];

var keyBytes = Convert.FromBase64String(builder.Configuration["Jwt:Key"]!);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        if (builder.Environment.IsDevelopment())
        {
            options.IncludeErrorDetails = true;
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    Console.WriteLine($"Authorization header: '{ctx.Request.Headers.Authorization}'");
                    return Task.CompletedTask;
                }
            };
        }
        options.MapInboundClaims = false; // keep "sub", "preferred_username", etc.
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = JwtRegisteredClaimNames.PreferredUsername, // or ClaimTypes.Name
            RoleClaimType = ClaimTypes.Role
        };

        if (builder.Environment.IsDevelopment())
        {
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = ctx =>
                {
                    var ex = ctx.Exception;
                    ctx.Response.StatusCode = 401;
                    return Task.CompletedTask;
                }
            };
        }
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
});


var app = builder.Build();

// IMPORTANT: do this early, before auth/routing/etc.
var fwd = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
};
// If running in containers, Kestrel may not recognize the proxy by default:
fwd.KnownIPNetworks.Clear();
fwd.KnownProxies.Clear();

app.UseForwardedHeaders(fwd);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
