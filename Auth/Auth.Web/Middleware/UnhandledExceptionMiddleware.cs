using Auth.App.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace Auth.Web.Middleware
{
    public class UnhandledExceptionMiddleware(RequestDelegate next, ILogger<UnhandledExceptionMiddleware> logger, IWebHostEnvironment environment)
    {

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (Exception ex)
            {
                var isCustomException = ex is AppException;
                var correlationId = Guid.NewGuid();

                logger.LogError(ex, "Unhandled {ExceptionType} exception: {Message}. CorrelationId: {CorrelationId}",
                    isCustomException ? "custom" : "external", ex.Message, correlationId);
                
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                
                var problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = $"Internal Server Error",
                    Detail = environment.IsDevelopment() ? ex.Message : "An error occurred while processing your request.",
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1"
                };
                
                // In development, you might want to include more details
                if (environment.IsDevelopment())
                {
                    problemDetails.Extensions["StackTrace"] = ex.StackTrace;
                }
                
                problemDetails.Extensions["CorrelationId"] = correlationId;
                await context.Response.WriteAsJsonAsync(problemDetails);
            }
        }
    }
}
