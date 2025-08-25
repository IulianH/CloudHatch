using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "CloudHatch resources API",
        Version = "v1",
        Description = "A JWT token management API"
    });
    
    // Ensure proper sidebar display
    c.DocInclusionPredicate((docName, apiDesc) => true);
});

// JWT bearer auth: validate tokens issued by the Auth service
var issuer = builder.Configuration["Jwt:Issuer"];
var audience = builder.Configuration["Jwt:Audience"];

var keyBytes = Convert.FromBase64String(builder.Configuration["Jwt:Key"]!);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.IncludeErrorDetails = true;
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx => {
                Console.WriteLine($"Authorization header: '{ctx.Request.Headers.Authorization}'");
                return Task.CompletedTask;
            }
        };
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
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                var ex = ctx.Exception;
                ctx.Response.StatusCode = 401;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();


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
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TokenHarbor API V1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "TokenHarbor API Documentation";
        c.DefaultModelsExpandDepth(2);
        c.DefaultModelExpandDepth(2);
    });
}

app.UseHttpsRedirection();

// Add global exception handling for Token library exceptions

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true; // dev only

app.Run();
