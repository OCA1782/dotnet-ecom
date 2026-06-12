using System.Security.Claims;
using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace Ecom.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    private IEnumerable<string> GetClaimValues(params string[] claimTypes)
    {
        if (User is null) return Enumerable.Empty<string>();
        return claimTypes
            .SelectMany(type => User.FindAll(type).Select(c => c.Value))
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Distinct(StringComparer.OrdinalIgnoreCase);
    }

    public Guid? UserId
    {
        get
        {
            var id = GetClaimValues(
                    ClaimTypes.NameIdentifier,
                    "sub",
                    "userId")
                .FirstOrDefault();

            return Guid.TryParse(id, out var parsed) ? parsed : null;
        }
    }

    public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value;

    public IEnumerable<string> Roles =>
        GetClaimValues(
            ClaimTypes.Role,
            "role",
            "roles",
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role");

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public bool IsSuperAdmin =>
        GetClaimValues("isSuperAdmin").Any(v => v.Equals("true", StringComparison.OrdinalIgnoreCase)) ||
        Roles.Any(r => r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase));

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
