
using Users.App;
using Users.App.Interface;
using Users.Infra;

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

builder.Services.RegisterInfrastructure(builder.Configuration);
builder.Services.AddTransient<LoginService, LoginService>();

var app = builder.Build();

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

app.MapControllers();

app.Services.GetRequiredService<IUserRepo>().Migrate();
app.Run();
