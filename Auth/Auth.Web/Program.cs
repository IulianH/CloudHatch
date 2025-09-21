using Auth.App;
using Auth.Infra;
using Auth.Web.Middleware;
using Microsoft.AspNetCore.HttpOverrides;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "TokenHarbor API",
        Version = "v1",
        Description = "A JWT token management API"
    });
    
    // Ensure proper sidebar display
    c.DocInclusionPredicate((docName, apiDesc) => true);
});

builder.Services.AddTransient<JwtTokenService, JwtTokenService>();
builder.Services.AddTransient<UserService, UserService>();

// Add HttpClient for external user service
builder.Services.AddHttpClient<UserService>(client =>
{
    var baseUrl = builder.Configuration["UserServiceBaseUrl"];
    client.BaseAddress = new Uri(baseUrl!);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

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
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TokenHarbor API V1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "TokenHarbor API Documentation";
        c.DefaultModelsExpandDepth(2);
        c.DefaultModelExpandDepth(2);
    });
    
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

Console.WriteLine($"Starting : {app.Environment.EnvironmentName}");
app.Run();
