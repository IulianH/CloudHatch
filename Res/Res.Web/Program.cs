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

app.MapControllers();


app.Run();
