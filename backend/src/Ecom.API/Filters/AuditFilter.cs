using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Ecom.API.Filters;

public class AuditFilter(IApplicationDbContext db, ICurrentUserService currentUser) : IAsyncActionFilter
{
    private static readonly HashSet<string> TrackedPrefixes = [
        "/api/admin", "/api/products", "/api/categories", "/api/brands"
    ];

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();

        var method = context.HttpContext.Request.Method;
        if (method.Equals("GET", StringComparison.OrdinalIgnoreCase)) return;

        var statusCode = executed.HttpContext.Response.StatusCode;
        if (statusCode < 200 || statusCode >= 300) return;

        var path = context.HttpContext.Request.Path.Value ?? "";
        if (!TrackedPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase))) return;

        try
        {
            var log = new AuditLog
            {
                UserId = currentUser.UserId,
                Action = $"{MapMethod(method)} — {MapEntityName(path)}",
                EntityName = MapEntityName(path),
                EntityId = ExtractEntityId(path),
                IpAddress = currentUser.IpAddress ?? context.HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.HttpContext.Request.Headers.UserAgent.ToString()
            };

            db.AuditLogs.Add(log);
            await db.SaveChangesAsync(CancellationToken.None);
        }
        catch
        {
            // Audit log failure must not break the main request
        }
    }

    private static string MapMethod(string method) => method.ToUpperInvariant() switch
    {
        "POST" => "Oluşturuldu",
        "PUT" => "Güncellendi",
        "PATCH" => "Güncellendi",
        "DELETE" => "Silindi",
        _ => method
    };

    private static string MapEntityName(string path)
    {
        var p = path.ToLower();
        if (p.Contains("users")) return "Kullanıcı";
        if (p.Contains("stocks")) return "Stok";
        if (p.Contains("images")) return "Ürün Görseli";
        if (p.Contains("products")) return "Ürün";
        if (p.Contains("categories")) return "Kategori";
        if (p.Contains("brands")) return "Marka";
        if (p.Contains("coupons")) return "Kupon";
        if (p.Contains("orders")) return "Sipariş";
        if (p.Contains("reviews")) return "Yorum";
        if (p.Contains("shipments")) return "Kargo";
        if (p.Contains("dashboard")) return "Dashboard";
        return path;
    }

    private static string? ExtractEntityId(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        // Last segment that looks like a GUID or is not a keyword
        foreach (var seg in segments.Reverse())
        {
            if (Guid.TryParse(seg, out _)) return seg;
        }
        return null;
    }
}
