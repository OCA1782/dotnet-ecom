using System.Security.Claims;
using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace Ecom.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var id = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return id is not null ? Guid.Parse(id) : null;
        }
    }

    public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value;

    public IEnumerable<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? Enumerable.Empty<string>();

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public string? IpAddress
    {
        get
        {
            var ctx = httpContextAccessor.HttpContext;
            if (ctx is null) return null;
            var forwarded = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwarded))
                return NormalizeIp(forwarded.Split(',')[0].Trim());
            return NormalizeIp(ctx.Connection.RemoteIpAddress?.ToString());
        }
    }

    private static string? NormalizeIp(string? ip) =>
        ip is "::1" ? "127.0.0.1" : ip;

    public string? SessionId =>
        httpContextAccessor.HttpContext?.Request.Cookies["guest_session_id"];

    public string? UserAgent =>
        httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].FirstOrDefault();
}
