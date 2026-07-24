using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Middleware;

public class ErrorLoggingMiddleware(RequestDelegate next, ILogger<ErrorLoggingMiddleware> logger)
{
    private const int MaxPayloadBytes = 4096;

    public async Task InvokeAsync(HttpContext context)
    {
        // Buffer request body so it can be read in the error logger
        context.Request.EnableBuffering();

        // Capture response body by replacing the stream
        var originalResponseBody = context.Response.Body;
        using var responseBuffer = new MemoryStream();
        context.Response.Body = responseBuffer;

        try
        {
            await next(context);

            if (context.Response.StatusCode >= 400 && context.Response.StatusCode < 500
                && context.Response.StatusCode != 401 && context.Response.StatusCode != 403)
            {
                var reqPayload  = await ReadRequestPayloadAsync(context.Request);
                var respPayload = await ReadResponsePayloadAsync(responseBuffer);
                await LogAsync(context, "Warning", $"HTTP {context.Response.StatusCode}",
                    context.Request.Path, null, reqPayload: reqPayload, respPayload: respPayload);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);

            var reqPayload  = await ReadRequestPayloadAsync(context.Request);
            await LogAsync(context, "Error", ex.Message, context.Request.Path, ex.StackTrace,
                ex.GetType().Name, reqPayload: reqPayload);

            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { error = "Sunucu hatası oluştu." });
            }
        }
        finally
        {
            // Copy buffered response back to original stream
            responseBuffer.Seek(0, SeekOrigin.Begin);
            await responseBuffer.CopyToAsync(originalResponseBody);
            context.Response.Body = originalResponseBody;
        }
    }

    private static async Task<string?> ReadRequestPayloadAsync(HttpRequest req)
    {
        try
        {
            if (req.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) != true
                && req.ContentType?.Contains("text/", StringComparison.OrdinalIgnoreCase) != true)
                return null;

            req.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(req.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            req.Body.Seek(0, SeekOrigin.Begin);

            if (string.IsNullOrWhiteSpace(body)) return null;
            if (body.Length > MaxPayloadBytes)
                return body[..MaxPayloadBytes] + " ...[truncated]";
            return body;
        }
        catch { return null; }
    }

    private static async Task<string?> ReadResponsePayloadAsync(MemoryStream buffer)
    {
        try
        {
            if (buffer.Length == 0) return null;
            buffer.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(buffer, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            buffer.Seek(0, SeekOrigin.Begin);

            if (body.Length > MaxPayloadBytes)
                return body[..MaxPayloadBytes] + " ...[truncated]";
            return string.IsNullOrWhiteSpace(body) ? null : body;
        }
        catch { return null; }
    }

    private static async Task LogAsync(
        HttpContext context, string level, string message, string path,
        string? stackTrace, string? exceptionType = null,
        string? reqPayload = null, string? respPayload = null)
    {
        try
        {
            using var scope = context.RequestServices.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var userEmail = context.User.Identity?.IsAuthenticated == true
                ? context.User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value
                : null;

            var req = context.Request;
            var url = $"{req.Scheme}://{req.Host}{req.Path}{req.QueryString}";

            db.ErrorLogs.Add(new ErrorLog
            {
                Source          = "Backend",
                Level           = level,
                Message         = message,
                StackTrace      = stackTrace,
                Path            = path,
                Url             = url,
                ExceptionType   = exceptionType,
                UserEmail       = userEmail,
                IpAddress       = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent       = context.Request.Headers.UserAgent.FirstOrDefault(),
                StatusCode      = context.Response.StatusCode > 0 ? context.Response.StatusCode : null,
                RequestPayload  = reqPayload,
                ResponsePayload = respPayload,
            });
            await db.SaveChangesAsync(default);
        }
        catch { /* do not let logging failure break the response */ }
    }
}
