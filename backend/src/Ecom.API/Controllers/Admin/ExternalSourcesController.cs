using Ecom.API.Filters;
using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin;
using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using Ecom.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using System.Web;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/external-sources")]
[Authorize(Roles = "SuperAdmin,Admin")]
[RequiresLicense("DisKaynaklar")]
public class ExternalSourcesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await mediator.Send(new GetExternalSourcesQuery(), ct));

    [HttpGet("{id:guid}/logs")]
    public async Task<IActionResult> GetLogs(Guid id, CancellationToken ct) =>
        Ok(await mediator.Send(new GetExternalSourceImportLogsQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSourceRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateExternalSourceCommand(req.Name, req.Code, req.Type, req.Description, req.Config, req.FetchSchedule, req.AutoImportTarget), ct);
        return Ok(new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSourceRequest req, CancellationToken ct)
    {
        var ok = await mediator.Send(new UpdateExternalSourceCommand(id, req.Name, req.Code, req.Type, req.Description, req.Config, req.IsActive, req.FetchSchedule, req.AutoImportTarget), ct);
        return ok ? Ok() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteExternalSourceCommand(id), ct);
        return ok ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/fetch")]
    public async Task<IActionResult> Fetch(Guid id,
        [FromServices] IWebHostEnvironment env,
        CancellationToken ct)
    {
        var result = await mediator.Send(new FetchExternalSourceCommand(id), ct);
        if (result.Error is null && result.Rows.Count > 0)
        {
            var uploadDir = Path.Combine(env.ContentRootPath, "uploads", "external-sources");
            Directory.CreateDirectory(uploadDir);
            var previewPath = Path.Combine(uploadDir, $"{id}-preview.json");
            var json = JsonSerializer.Serialize(new { columns = result.Columns, rows = result.Rows });
            await System.IO.File.WriteAllTextAsync(previewPath, json, ct);
        }
        return Ok(result);
    }

    // Fetch a single page from a paginated REST API source — used for progressive loading
    [HttpGet("{id:guid}/fetch-page")]
    public async Task<IActionResult> FetchPage(Guid id,
        [FromServices] IApplicationDbContext db,
        [FromServices] IHttpClientFactory httpClientFactory,
        CancellationToken ct,
        int page = 1)
    {
        var source = await db.ExternalSources.FindAsync([id], ct);
        if (source is null) return NotFound();
        if (source.Type != "RestApi")
            return Ok(new { error = "Sayfalı çekim yalnızca REST API kaynakları için geçerlidir." });
        if (string.IsNullOrWhiteSpace(source.Config))
            return Ok(new { error = "Config eksik." });

        JsonElement cfg;
        try { cfg = JsonDocument.Parse(source.Config).RootElement; }
        catch { return Ok(new { error = "Config geçersiz JSON." }); }

        if (!cfg.TryGetProperty("url", out var urlEl))
            return Ok(new { error = "URL bulunamadı." });

        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(30);
        if (cfg.TryGetProperty("headers", out var hdrs) && hdrs.ValueKind == JsonValueKind.Object)
            foreach (var kv in hdrs.EnumerateObject())
                client.DefaultRequestHeaders.TryAddWithoutValidation(kv.Name, kv.Value.GetString());

        var paginate  = cfg.TryGetProperty("paginate",      out var pgv)  && pgv.ValueKind == JsonValueKind.True;
        var pageParam = cfg.TryGetProperty("pageParam",      out var ppar) ? ppar.GetString() ?? "page"     : "page";
        var psParam   = cfg.TryGetProperty("pageSizeParam",  out var psp)  ? psp.GetString()  ?? "pageSize" : "pageSize";
        var pageSize  = cfg.TryGetProperty("pageSize",       out var psv)  && psv.ValueKind == JsonValueKind.Number ? psv.GetInt32() : (int?)null;
        var dataPath  = cfg.TryGetProperty("dataPath",       out var dp)   ? dp.GetString()                 : null;

        var ub = new UriBuilder(urlEl.GetString()!);
        var qs = HttpUtility.ParseQueryString(ub.Query);
        if (paginate)
        {
            qs[pageParam] = page.ToString();
            if (pageSize.HasValue) qs[psParam] = pageSize.Value.ToString();
        }
        ub.Query = qs.ToString();

        HttpResponseMessage response;
        try { response = await client.GetAsync(ub.ToString(), ct); }
        catch (Exception ex) { return Ok(new { error = $"Bağlantı hatası: {ex.Message}" }); }

        if (!response.IsSuccessStatusCode)
            return Ok(new { error = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}" });

        var jsonStr = await response.Content.ReadAsStringAsync(ct);
        JsonDocument doc;
        try { doc = JsonDocument.Parse(jsonStr); }
        catch { return Ok(new { error = "Yanıt geçerli bir JSON değil." }); }

        var rootFull = doc.RootElement;

        // Extract pagination metadata before navigating dataPath
        bool hasNextPage = false;
        int? totalCount = null;
        int? totalPages = null;
        if (rootFull.ValueKind == JsonValueKind.Object)
        {
            if (rootFull.TryGetProperty("hasNextPage", out var hnp) && hnp.ValueKind == JsonValueKind.True)
                hasNextPage = true;
            if (rootFull.TryGetProperty("totalCount", out var tc) && tc.ValueKind == JsonValueKind.Number)
                totalCount = tc.GetInt32();
            if (rootFull.TryGetProperty("totalPages", out var tp) && tp.ValueKind == JsonValueKind.Number)
                totalPages = tp.GetInt32();
        }

        var dataRoot = rootFull;
        if (!string.IsNullOrWhiteSpace(dataPath))
        {
            try { foreach (var part in dataPath!.Split('.')) dataRoot = dataRoot.GetProperty(part); }
            catch { return Ok(new { error = $"DataPath '{dataPath}' yanıtta bulunamadı." }); }
        }

        string[] arrayCandidates = ["items", "data", "products", "results", "content", "records", "list", "rows", "entries"];
        if (dataRoot.ValueKind == JsonValueKind.Object && string.IsNullOrWhiteSpace(dataPath))
        {
            foreach (var candidate in arrayCandidates)
                if (dataRoot.TryGetProperty(candidate, out var arr) && arr.ValueKind == JsonValueKind.Array)
                { dataRoot = arr; break; }
        }

        if (dataRoot.ValueKind != JsonValueKind.Array)
            return Ok(new { error = "Veri dizisi bulunamadı. DataPath ayarlayın." });

        var columns = new List<string>();
        var rows = new List<Dictionary<string, string>>();
        foreach (var item in dataRoot.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;
            var row = new Dictionary<string, string>();
            foreach (var prop in item.EnumerateObject())
            {
                if (!columns.Contains(prop.Name)) columns.Add(prop.Name);
                row[prop.Name] = prop.Value.ValueKind == JsonValueKind.Null ? "" : prop.Value.ToString();
            }
            rows.Add(row);
        }

        // Derive totalPages from totalCount + pageSize if not returned directly
        if (!totalPages.HasValue && totalCount.HasValue && pageSize.HasValue && pageSize.Value > 0)
            totalPages = (int)Math.Ceiling((double)totalCount.Value / pageSize.Value);

        // hasNextPage fallback: full page received → more likely exists
        if (!hasNextPage && rows.Count > 0 && pageSize.HasValue && rows.Count >= pageSize.Value)
            hasNextPage = true;

        return Ok(new { columns, rows, page, totalPages, totalCount, hasNextPage });
    }

    // Save accumulated preview rows to file cache (called by frontend after progressive fetch)
    [HttpPost("{id:guid}/save-preview")]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> SavePreview(Guid id,
        [FromBody] SavePreviewRequest data,
        [FromServices] IWebHostEnvironment env,
        CancellationToken ct)
    {
        var uploadDir = Path.Combine(env.ContentRootPath, "uploads", "external-sources");
        Directory.CreateDirectory(uploadDir);
        var previewPath = Path.Combine(uploadDir, $"{id}-preview.json");
        var json = JsonSerializer.Serialize(new { columns = data.Columns, rows = data.Rows });
        await System.IO.File.WriteAllTextAsync(previewPath, json, ct);
        return Ok();
    }

    [HttpPost("{id:guid}/upload-excel")]
    [RequestSizeLimit(52_428_800)] // 50 MB
    public async Task<IActionResult> UploadExcel(Guid id, IFormFile file,
        [FromServices] IApplicationDbContext db,
        [FromServices] IWebHostEnvironment env,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest("Dosya bulunamadı.");

        var source = await db.ExternalSources.FindAsync([id], ct);
        if (source is null) return NotFound();

        // Persist the file so we can re-parse after a browser refresh
        var uploadDir = Path.Combine(env.ContentRootPath, "uploads", "external-sources");
        Directory.CreateDirectory(uploadDir);
        var filePath = Path.Combine(uploadDir, $"{id}.xlsx");
        await using (var fs = System.IO.File.Create(filePath))
            await file.CopyToAsync(fs, ct);

        using var stream = System.IO.File.OpenRead(filePath);
        var result = ExternalSourceFetcher.ParseExcel(stream);

        source.LastFetchedAt = DateTime.UtcNow;
        source.LastFetchedCount = result.Rows.Count;
        source.LastExcelFilePath = filePath;
        await db.SaveChangesAsync(ct);

        return Ok(result);
    }

    [HttpGet("{id:guid}/download-excel")]
    public async Task<IActionResult> DownloadExcel(Guid id,
        [FromServices] IApplicationDbContext db,
        CancellationToken ct)
    {
        var source = await db.ExternalSources.FindAsync([id], ct);
        if (source is null) return NotFound();
        if (string.IsNullOrWhiteSpace(source.LastExcelFilePath) || !System.IO.File.Exists(source.LastExcelFilePath))
            return NotFound("Excel dosyası bulunamadı.");

        var fileName = $"{source.Name.Replace(" ", "_")}.xlsx";
        var stream = System.IO.File.OpenRead(source.LastExcelFilePath);
        return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    // Re-parse preview after browser refresh — Excel: re-parses saved file; RestApi: returns file cache
    [HttpGet("{id:guid}/preview")]
    public async Task<IActionResult> GetPreview(Guid id,
        [FromServices] IApplicationDbContext db,
        [FromServices] IWebHostEnvironment env,
        CancellationToken ct)
    {
        var source = await db.ExternalSources.FindAsync([id], ct);
        if (source is null) return NotFound();

        if (source.Type == "Excel")
        {
            if (string.IsNullOrWhiteSpace(source.LastExcelFilePath) || !System.IO.File.Exists(source.LastExcelFilePath))
                return Ok(new { columns = Array.Empty<string>(), rows = Array.Empty<object>(), error = "Dosya bulunamadı. Lütfen tekrar yükleyin." });

            using var stream = System.IO.File.OpenRead(source.LastExcelFilePath);
            return Ok(ExternalSourceFetcher.ParseExcel(stream));
        }

        // REST API — return file cache saved after last fetch
        var previewPath = Path.Combine(env.ContentRootPath, "uploads", "external-sources", $"{id}-preview.json");
        if (System.IO.File.Exists(previewPath))
        {
            var cached = await System.IO.File.ReadAllTextAsync(previewPath, ct);
            return Content(cached, "application/json");
        }
        return Ok(new { columns = Array.Empty<string>(), rows = Array.Empty<object>(), error = "Önce 'Veri Çek' butonuna tıklayın." });
    }

    [HttpPost("{id:guid}/import")]
    public async Task<IActionResult> Import(Guid id, [FromBody] ImportRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userGuid = userId != null ? Guid.Parse(userId) : null;

        var result = await mediator.Send(new ImportExternalSourceCommand(
            id, req.TargetEntity, req.Rows, req.FieldMapping, req.ConflictStrategy, userGuid), ct);
        return Ok(result);
    }

    // Large import (> 5K rows): Claim Check via RabbitMQ — returns jobId immediately
    [HttpPost("{id:guid}/import-async")]
    [RequestSizeLimit(52_428_800)] // 50 MB
    public async Task<IActionResult> ImportAsync(Guid id, [FromBody] ImportRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userGuid = userId != null ? Guid.Parse(userId) : null;

        var jobId = await mediator.Send(new QueueImportJobCommand(
            id, req.TargetEntity, req.Rows, req.FieldMapping, req.ConflictStrategy, userGuid), ct);
        return Ok(new { jobId });
    }

    // Large source fetch-and-import: consumer fetches all pages from source server-side — no payload size limit
    [HttpPost("{id:guid}/fetch-and-import")]
    public async Task<IActionResult> FetchAndImport(Guid id, [FromBody] FetchAndImportRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userGuid = userId != null ? Guid.Parse(userId) : null;
        var jobId = await mediator.Send(new QueueFetchAndImportJobCommand(
            id, req.TargetEntity, req.FieldMapping, req.ConflictStrategy, userGuid, req.SyncDelete), ct);
        return Ok(new { jobId });
    }

    [HttpGet("import-jobs/{jobId:guid}")]
    public async Task<IActionResult> GetImportJobStatus(Guid jobId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetImportJobStatusQuery(jobId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("import-jobs/{jobId:guid}/cancel")]
    public async Task<IActionResult> CancelImportJob(Guid jobId, CancellationToken ct)
    {
        var ok = await mediator.Send(new CancelImportJobCommand(jobId), ct);
        return ok ? Ok() : NotFound();
    }

    // Quick count: fetches page=1 to extract totalCount metadata — no full pagination
    [HttpGet("{id:guid}/count")]
    public async Task<IActionResult> GetSourceCount(Guid id,
        [FromServices] IApplicationDbContext db,
        [FromServices] IHttpClientFactory httpClientFactory,
        CancellationToken ct)
    {
        var source = await db.ExternalSources.FindAsync([id], ct);
        if (source is null) return NotFound();

        if (source.Type == "Excel")
            return Ok(new { totalAvailable = source.LastFetchedCount, source = "cache" });

        if (string.IsNullOrWhiteSpace(source.Config))
            return Ok(new { totalAvailable = (int?)null, error = "Config eksik." });

        JsonElement cfg;
        try { cfg = JsonDocument.Parse(source.Config).RootElement; }
        catch { return Ok(new { totalAvailable = (int?)null, error = "Config geçersiz JSON." }); }

        if (!cfg.TryGetProperty("url", out var urlEl))
            return Ok(new { totalAvailable = (int?)null, error = "URL bulunamadı." });

        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        if (cfg.TryGetProperty("headers", out var hdrs) && hdrs.ValueKind == JsonValueKind.Object)
            foreach (var kv in hdrs.EnumerateObject())
                client.DefaultRequestHeaders.TryAddWithoutValidation(kv.Name, kv.Value.GetString());

        var ub = new UriBuilder(urlEl.GetString()!);
        var qs = HttpUtility.ParseQueryString(ub.Query);
        var pageParam = cfg.TryGetProperty("pageParam", out var pp) ? pp.GetString() ?? "page" : "page";
        var pageSizeParam = cfg.TryGetProperty("pageSizeParam", out var psp) ? psp.GetString() ?? "pageSize" : "pageSize";
        qs[pageParam] = "1";
        qs[pageSizeParam] = "1";
        ub.Query = qs.ToString();

        try
        {
            var resp = await client.GetAsync(ub.ToString(), ct);
            if (!resp.IsSuccessStatusCode)
                return Ok(new { totalAvailable = (int?)null, error = $"HTTP {(int)resp.StatusCode}" });

            var json = await resp.Content.ReadAsStringAsync(ct);
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("totalCount", out var tc) && tc.ValueKind == JsonValueKind.Number)
                return Ok(new { totalAvailable = tc.GetInt32(), source = "live" });

            // Fallback: count items in response
            var dataPath = cfg.TryGetProperty("dataPath", out var dp) ? dp.GetString() : null;
            if (!string.IsNullOrWhiteSpace(dataPath))
            {
                foreach (var part in dataPath!.Split('.'))
                    if (root.TryGetProperty(part, out var child)) root = child; else break;
            }
            if (root.ValueKind == JsonValueKind.Array)
                return Ok(new { totalAvailable = (int?)null, note = "totalCount metadata bulunamadı — tam çekim yapın." });

            return Ok(new { totalAvailable = (int?)null, note = "totalCount metadata bulunamadı." });
        }
        catch (Exception ex) { return Ok(new { totalAvailable = (int?)null, error = ex.Message }); }
    }

    // Check which identifiers (SKU, Name etc.) are already imported into the target entity
    [HttpPost("{id:guid}/check-imported")]
    public async Task<IActionResult> CheckImported(Guid id,
        [FromBody] CheckImportedRequest req,
        [FromServices] IApplicationDbContext db,
        CancellationToken ct)
    {
        if (req.Identifiers is not { Count: > 0 }) return Ok(new { imported = Array.Empty<string>() });

        HashSet<string> imported;
        if (req.TargetEntity == "Product" || req.TargetEntity == "Stock")
        {
            var set = await db.Products
                .Where(p => !p.IsDeleted && p.SKU != null && req.Identifiers.Contains(p.SKU))
                .Select(p => p.SKU!)
                .ToListAsync(ct);
            imported = [.. set];
        }
        else if (req.TargetEntity == "Brand")
        {
            var set = await db.Brands
                .Where(b => !b.IsDeleted && req.Identifiers.Contains(b.Name))
                .Select(b => b.Name)
                .ToListAsync(ct);
            imported = [.. set];
        }
        else if (req.TargetEntity == "Category")
        {
            var set = await db.Categories
                .Where(c => !c.IsDeleted && req.Identifiers.Contains(c.Name))
                .Select(c => c.Name)
                .ToListAsync(ct);
            imported = [.. set];
        }
        else return BadRequest("Geçersiz TargetEntity.");

        return Ok(new { imported = imported.ToArray() });
    }

    // Ad-hoc REST fetch without a saved source — used in the add/edit modal
    [HttpPost("test-fetch")]
    public async Task<IActionResult> TestFetch(
        [FromBody] TestFetchRequest req,
        [FromServices] IHttpClientFactory httpClientFactory,
        CancellationToken ct)
    {
        try { _ = new Uri(req.Url); } catch { return BadRequest(new { error = "Geçersiz URL." }); }

        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(15);
        if (req.Headers != null)
            foreach (var kv in req.Headers)
                client.DefaultRequestHeaders.TryAddWithoutValidation(kv.Key, kv.Value);

        // Build URL with page=1 when pagination is configured (preview shows first page only)
        var fetchUrl = req.Url;
        if (req.Paginate)
        {
            var ub = new UriBuilder(req.Url);
            var qs = System.Web.HttpUtility.ParseQueryString(ub.Query);
            qs[req.PageParam ?? "page"] = "1";
            if (req.PageSize.HasValue)
                qs[req.PageSizeParam ?? "pageSize"] = req.PageSize.Value.ToString();
            ub.Query = qs.ToString();
            fetchUrl = ub.ToString();
        }

        System.Text.Json.JsonElement root;
        try
        {
            var response = await client.GetAsync(fetchUrl, ct);
            if (!response.IsSuccessStatusCode)
                return Ok(new { columns = Array.Empty<string>(), rows = Array.Empty<object>(), error = $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}" });
            var json = await response.Content.ReadAsStringAsync(ct);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            root = doc.RootElement;
        }
        catch (Exception ex) { return Ok(new { columns = Array.Empty<string>(), rows = Array.Empty<object>(), error = ex.Message }); }

        if (!string.IsNullOrWhiteSpace(req.DataPath))
        {
            try { foreach (var part in req.DataPath.Split('.')) root = root.GetProperty(part); }
            catch { return Ok(new { columns = Array.Empty<string>(), rows = Array.Empty<object>(), error = $"DataPath '{req.DataPath}' bulunamadı." }); }
        }

        // Auto-detect common array container keys when DataPath is not set
        string? detectedPath = null;
        if (root.ValueKind == System.Text.Json.JsonValueKind.Object && string.IsNullOrWhiteSpace(req.DataPath))
        {
            foreach (var candidate in new[] { "items", "data", "products", "results", "content", "records", "list", "rows", "entries" })
            {
                if (root.TryGetProperty(candidate, out var arr) && arr.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    detectedPath = candidate;
                    root = arr;
                    break;
                }
            }
        }

        if (root.ValueKind != System.Text.Json.JsonValueKind.Array)
        {
            var availableKeys = root.ValueKind == System.Text.Json.JsonValueKind.Object
                ? string.Join(", ", root.EnumerateObject().Select(p => $"\"{p.Name}\"").Take(6))
                : "";
            var hint = string.IsNullOrEmpty(availableKeys)
                ? "Yanıt bir JSON dizisi değil. DataPath ayarlayın."
                : $"Yanıt bir JSON dizisi değil. Yanıttaki anahtarlar: {availableKeys}. DataPath alanına uygun anahtarı girin.";
            return Ok(new { columns = Array.Empty<string>(), rows = Array.Empty<object>(), error = hint });
        }

        var columns = new List<string>();
        var rows = new List<Dictionary<string, string>>();
        foreach (var item in root.EnumerateArray())
        {
            if (item.ValueKind != System.Text.Json.JsonValueKind.Object) continue;
            var row = new Dictionary<string, string>();
            foreach (var prop in item.EnumerateObject())
            {
                if (!columns.Contains(prop.Name)) columns.Add(prop.Name);
                row[prop.Name] = prop.Value.ValueKind == System.Text.Json.JsonValueKind.Null ? "" : prop.Value.ToString();
            }
            rows.Add(row);
        }

        var notes = new List<string>();
        if (req.Paginate) notes.Add("sayfa 1 önizleme — tüm sayfalar gerçek çekimde alınır");
        if (detectedPath != null) notes.Add($"DataPath otomatik algılandı: \"{detectedPath}\" — kaydetmek için Veri Yolu alanına yazın");
        var note = notes.Count > 0 ? string.Join("; ", notes) : null;
        return Ok(new { columns, rows, error = (string?)null, note });
    }

    public record CreateSourceRequest(string Name, string? Code, string Type, string? Description, string? Config,
        string FetchSchedule = "None", string? AutoImportTarget = null);
    public record UpdateSourceRequest(string Name, string? Code, string Type, string? Description, string? Config, bool IsActive,
        string FetchSchedule = "None", string? AutoImportTarget = null);
    public record ImportRequest(
        string TargetEntity,
        List<Dictionary<string, string>> Rows,
        Dictionary<string, string> FieldMapping,
        string ConflictStrategy
    );
    public record TestFetchRequest(
        string Url,
        Dictionary<string, string>? Headers,
        string? DataPath,
        bool Paginate = false,
        string? PageParam = null,
        string? PageSizeParam = null,
        int? PageSize = null
    );
    public record CheckImportedRequest(
        string TargetEntity,
        List<string> Identifiers
    );
    public record FetchAndImportRequest(
        string TargetEntity,
        Dictionary<string, string> FieldMapping,
        string ConflictStrategy,
        bool SyncDelete = false
    );
    public record SavePreviewRequest(
        List<string> Columns,
        List<Dictionary<string, string>> Rows
    );
}
