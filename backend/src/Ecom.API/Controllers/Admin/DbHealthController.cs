using Ecom.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Text.Json;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/db-health")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class DbHealthController(
    ApplicationDbContext db,
    IWebHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var provider = db.Database.ProviderName ?? "Unknown";
        var sw = Stopwatch.StartNew();
        bool canConnect;
        string? connectError = null;
        try
        {
            canConnect = await db.Database.CanConnectAsync(ct);
        }
        catch (Exception ex)
        {
            canConnect = false;
            connectError = ex.Message;
        }
        sw.Stop();

        return Ok(new
        {
            Provider = provider,
            CanConnect = canConnect,
            ConnectError = connectError,
            PingMs = sw.ElapsedMilliseconds,
            SlowQueries = new
            {
                TotalCount = SlowQueryInterceptor.TotalSlowQueryCount,
                ThresholdMs = 500,
                Recent = SlowQueryInterceptor.RecentSlowQueries
                    .OrderByDescending(q => q.OccurredAt)
                    .Take(20)
                    .Select(q => new
                    {
                        q.OccurredAt,
                        q.DurationMs,
                        SqlPreview = q.CommandText.Length > 200 ? q.CommandText[..200] + "…" : q.CommandText,
                    }),
            },
        });
    }

    [HttpPatch("provider")]
    [Authorize(Roles = "SuperAdmin")]
    public IActionResult ChangeProvider([FromBody] ChangeProviderRequest request)
    {
        if (request.Provider != "SqlServer" && request.Provider != "PostgreSQL")
            return BadRequest(new { error = "Geçersiz sağlayıcı. 'SqlServer' veya 'PostgreSQL' olmalıdır." });

        var appSettingsPath = Path.Combine(env.ContentRootPath, "appsettings.json");
        if (!System.IO.File.Exists(appSettingsPath))
            return StatusCode(500, new { error = "appsettings.json bulunamadı." });

        try
        {
            var json = System.IO.File.ReadAllText(appSettingsPath);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var updated = UpdateJson(json, "Database", "Provider", request.Provider);
            System.IO.File.WriteAllText(appSettingsPath, updated);

            return Ok(new
            {
                success = true,
                provider = request.Provider,
                message = $"Sağlayıcı '{request.Provider}' olarak güncellendi. Değişikliğin etkin olması için API'yi yeniden başlatın.",
                restartRequired = true,
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"appsettings.json güncellenemedi: {ex.Message}" });
        }
    }

    private static string UpdateJson(string json, string section, string key, string value)
    {
        using var doc = JsonDocument.Parse(json);
        var opts = new JsonSerializerOptions { WriteIndented = true };
        using var stream = new System.IO.MemoryStream();
        using var writer = new Utf8JsonWriter(stream, new JsonWriterOptions { Indented = true });

        writer.WriteStartObject();
        foreach (var prop in doc.RootElement.EnumerateObject())
        {
            if (prop.Name == section)
            {
                writer.WritePropertyName(prop.Name);
                writer.WriteStartObject();
                bool written = false;
                foreach (var inner in prop.Value.EnumerateObject())
                {
                    if (inner.Name == key)
                    {
                        writer.WriteString(key, value);
                        written = true;
                    }
                    else
                    {
                        inner.WriteTo(writer);
                    }
                }
                if (!written) writer.WriteString(key, value);
                writer.WriteEndObject();
            }
            else
            {
                prop.WriteTo(writer);
            }
        }
        writer.WriteEndObject();
        writer.Flush();
        return System.Text.Encoding.UTF8.GetString(stream.ToArray());
    }
}

public record ChangeProviderRequest(string Provider);
