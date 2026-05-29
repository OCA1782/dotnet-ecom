using FluentValidation;
using System.Text.Json;

namespace Ecom.API.Middleware;

public class ValidationExceptionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            var error = string.Join(" ", ex.Errors.Select(e => e.ErrorMessage).Distinct());
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { error }));
        }
        catch (UnauthorizedAccessException)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
        }
    }
}
