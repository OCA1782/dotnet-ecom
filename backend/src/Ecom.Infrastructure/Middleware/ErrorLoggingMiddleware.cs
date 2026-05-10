using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Middleware;

public class ErrorLoggingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);

            if (context.Response.StatusCode >= 400 && context.Response.StatusCode < 500 && context.Response.StatusCode != 401 && context.Response.StatusCode != 403)
            {
                await LogAsync(context, "Warning", $"HTTP {context.Response.StatusCode}", context.Request.Path, null);
            }
        }
        catch (Exception ex)
        {
            await LogAsync(context, "Error", ex.Message, context.Request.Path, ex.StackTrace);

            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { error = "Sunucu hatası oluştu." });
            }
        }
    }

    private static async Task LogAsync(HttpContext context, string level, string message, string path, string? stackTrace)
    {
        try
        {
            using var scope = context.RequestServices.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var userEmail = context.User.Identity?.IsAuthenticated == true
                ? context.User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value
                : null;

            db.ErrorLogs.Add(new ErrorLog
            {
                Source = "Backend",
                Level = level,
                Message = message,
                StackTrace = stackTrace,
                Path = path,
                UserEmail = userEmail,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.Request.Headers.UserAgent.FirstOrDefault(),
                StatusCode = context.Response.StatusCode > 0 ? context.Response.StatusCode : null,
            });
            await db.SaveChangesAsync(default);
        }
        catch { /* do not let logging failure break the response */ }
    }
}
