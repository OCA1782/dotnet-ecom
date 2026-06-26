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
using System.Security.Claims;
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
        var id = await mediator.Send(new CreateExternalSourceCommand(req.Name, req.Type, req.Description, req.Config, req.FetchSchedule, req.AutoImportTarget), ct);
        return Ok(new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSourceRequest req, CancellationToken ct)
    {
        var ok = await mediator.Send(new UpdateExternalSourceCommand(id, req.Name, req.Type, req.Description, req.Config, req.IsActive, req.FetchSchedule, req.AutoImportTarget), ct);
        return ok ? Ok() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteExternalSourceCommand(id), ct);
        return ok ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/fetch")]
    public async Task<IActionResult> Fetch(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new FetchExternalSourceCommand(id), ct);
        return Ok(result);
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

    // Re-parse or re-fetch preview after browser refresh
    [HttpGet("{id:guid}/preview")]
    public async Task<IActionResult> GetPreview(Guid id,
        [FromServices] IApplicationDbContext db,
        [FromServices] IWebHostEnvironment env,
        [FromServices] IExternalSourceFetcher fetcher,
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

        // REST API — re-fetch live
        var result = await fetcher.FetchAsync(source, ct);
        return Ok(result);
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

    public record CreateSourceRequest(string Name, string Type, string? Description, string? Config,
        string FetchSchedule = "None", string? AutoImportTarget = null);
    public record UpdateSourceRequest(string Name, string Type, string? Description, string? Config, bool IsActive,
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
}
