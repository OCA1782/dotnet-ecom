using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecom.Infrastructure.Persistence;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/version")]
public class VersionController(ApplicationDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var apiVersion = System.Reflection.Assembly.GetExecutingAssembly()
            .GetName().Version?.ToString(3) ?? "1.0.0";

        var env = config["ASPNETCORE_ENVIRONMENT"] ?? "Development";

        string? pendingMigrations = null;
        string? appliedMigrations = null;
        try
        {
            var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
            var applied = (await db.Database.GetAppliedMigrationsAsync(ct)).ToList();
            pendingMigrations = pending.Count == 0 ? null : string.Join(", ", pending.Take(5));
            appliedMigrations = applied.LastOrDefault();
        }
        catch { }

        string? customerVersion = null;
        string? customerTemplate = null;
        string? maintenanceMode = null;
        try
        {
            var settings = await db.SiteSettings
                .Where(s => s.Key == "CustomerVersion" || s.Key == "CustomerTemplate" || s.Key == "MaintenanceMode")
                .ToListAsync(ct);
            customerVersion = settings.FirstOrDefault(s => s.Key == "CustomerVersion")?.Value;
            customerTemplate = settings.FirstOrDefault(s => s.Key == "CustomerTemplate")?.Value;
            maintenanceMode = settings.FirstOrDefault(s => s.Key == "MaintenanceMode")?.Value;
        }
        catch { }

        return Ok(new
        {
            api = new { version = apiVersion, environment = env },
            customer = new { version = customerVersion ?? "1.0.0", template = customerTemplate ?? "modern" },
            maintenance = maintenanceMode == "true",
            db = new { lastAppliedMigration = appliedMigrations, pendingMigrations },
            generatedAt = DateTime.UtcNow
        });
    }
}
