using Auth.App;
using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Middleware
{
    public class InputExceptionHandlerMiddleware(RequestDelegate next, ILogger<InputExceptionHandlerMiddleware> logger)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (InputException ex)
            {
                logger.LogWarning(ex, "InputException caught: {Message}", ex.Message);
                
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";
                
                var problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Bad Request",
                    Detail = ex.Message,
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1"
                };
                
                await context.Response.WriteAsJsonAsync(problemDetails);
            }
        }
    }
}
