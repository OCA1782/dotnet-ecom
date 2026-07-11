using Ecom.Application.Events;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Persistence;
using MassTransit;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text.Json;
using System.Web;

namespace Ecom.Infrastructure.Messaging.Consumers;

public class PreviewJobConsumer(IServiceScopeFactory scopeFactory, IWebHostEnvironment env, ILogger<PreviewJobConsumer> logger)
    : IConsumer<PreviewJobQueuedMessage>
{
    private const int FetchPageSize = 1000;

    public async Task Consume(ConsumeContext<PreviewJobQueuedMessage> context)
    {
        var jobId = context.Message.JobId;
        logger.LogInformation("PreviewJob {JobId} received", jobId);

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var job = await db.PreviewJobs
            .Include(j => j.ExternalSource)
            .FirstOrDefaultAsync(j => j.Id == jobId, context.CancellationToken);

        if (job is null) { logger.LogWarning("PreviewJob {JobId} not found", jobId); return; }

        job.Status = "Processing";
        job.StartedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(context.CancellationToken);
        db.ChangeTracker.Clear();

        var source = job.ExternalSource;
        if (string.IsNullOrWhiteSpace(source.Config))
        {
            await FailJob(db, job, "Kaynak config eksik.", context.CancellationToken);
            return;
        }

        JsonElement cfg;
        try { cfg = JsonDocument.Parse(source.Config).RootElement; }
        catch { await FailJob(db, job, "Config geçersiz JSON.", context.CancellationToken); return; }

        if (!cfg.TryGetProperty("url", out var urlEl))
        {
            await FailJob(db, job, "Config'de URL bulunamadı.", context.CancellationToken);
            return;
        }

        var baseUrl = urlEl.GetString()!;
        var pageParam  = cfg.TryGetProperty("pageParam",     out var pp)  ? pp.GetString()  ?? "page"     : "page";
        var psParam    = cfg.TryGetProperty("pageSizeParam",  out var psp) ? psp.GetString() ?? "pageSize" : "pageSize";
        var dataPath   = cfg.TryGetProperty("dataPath",       out var dp)  ? dp.GetString()               : null;

        var httpFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
        using var client = httpFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(60);
        if (cfg.TryGetProperty("headers", out var hdrs) && hdrs.ValueKind == JsonValueKind.Object)
            foreach (var kv in hdrs.EnumerateObject())
                client.DefaultRequestHeaders.TryAddWithoutValidation(kv.Name, kv.Value.GetString());

        List<string> columns = [];
        var allRows = new List<Dictionary<string, string>>();
        int totalPages = 0;
        int currentPage = 1;
        string? finalError = null;

        while (true)
        {
            // Cancellation / external cancel check
            var status = await db.PreviewJobs.AsNoTracking()
                .Where(j => j.Id == job.Id).Select(j => j.Status).FirstOrDefaultAsync(context.CancellationToken);
            if (status == "Cancelled")
            {
                logger.LogInformation("PreviewJob {JobId} cancelled at page {Page}", job.Id, currentPage);
                return;
            }

            var ub = new UriBuilder(baseUrl);
            var qs = HttpUtility.ParseQueryString(ub.Query);
            qs[pageParam] = currentPage.ToString();
            qs[psParam]   = FetchPageSize.ToString();
            ub.Query = qs.ToString();

            HttpResponseMessage response;
            try { response = await client.GetAsync(ub.ToString(), context.CancellationToken); }
            catch (Exception ex) { finalError = $"Bağlantı hatası (sayfa {currentPage}): {ex.Message}"; break; }

            if (!response.IsSuccessStatusCode) { finalError = $"HTTP {(int)response.StatusCode} (sayfa {currentPage})"; break; }

            var jsonStr = await response.Content.ReadAsStringAsync(context.CancellationToken);
            JsonDocument doc;
            try { doc = JsonDocument.Parse(jsonStr); }
            catch { finalError = $"JSON parse hatası (sayfa {currentPage})"; break; }

            var root = doc.RootElement;

            if (currentPage == 1 && root.ValueKind == JsonValueKind.Object)
            {
                int? tc = null;
                if (root.TryGetProperty("totalCount", out var tcEl) && tcEl.ValueKind == JsonValueKind.Number) tc = tcEl.GetInt32();
                if (root.TryGetProperty("totalPages",  out var tpEl) && tpEl.ValueKind == JsonValueKind.Number) totalPages = tpEl.GetInt32();
                if (totalPages == 0 && tc.HasValue) totalPages = (int)Math.Ceiling((double)tc.Value / FetchPageSize);

                var tracked = await db.PreviewJobs.FindAsync([job.Id], context.CancellationToken);
                if (tracked != null) { tracked.TotalPages = totalPages; await db.SaveChangesAsync(context.CancellationToken); }
                db.ChangeTracker.Clear();
            }

            var dataRoot = root;
            if (!string.IsNullOrWhiteSpace(dataPath))
            {
                try { foreach (var part in dataPath!.Split('.')) dataRoot = dataRoot.GetProperty(part); }
                catch { finalError = $"DataPath '{dataPath}' bulunamadı (sayfa {currentPage})"; break; }
            }

            if (dataRoot.ValueKind != JsonValueKind.Array) { finalError = "Veri dizisi bulunamadı — DataPath kontrol edin"; break; }

            var pageRows = new List<Dictionary<string, string>>();
            foreach (var item in dataRoot.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object) continue;
                var row = new Dictionary<string, string>();
                foreach (var prop in item.EnumerateObject())
                    row[prop.Name] = prop.Value.ValueKind == JsonValueKind.Null ? "" : prop.Value.ToString();
                pageRows.Add(row);
                // Collect column names from first page
                if (currentPage == 1 && columns.Count == 0)
                    columns = row.Keys.ToList();
            }

            if (pageRows.Count == 0) break;
            allRows.AddRange(pageRows);

            // Update progress
            var progressJob = await db.PreviewJobs.FindAsync([job.Id], context.CancellationToken);
            if (progressJob != null)
            {
                progressJob.ProcessedPages = currentPage;
                progressJob.TotalRows = allRows.Count;
                await db.SaveChangesAsync(context.CancellationToken);
            }
            db.ChangeTracker.Clear();

            logger.LogInformation("PreviewJob {JobId}: page {Page}/{Total} ({Rows} rows total)", job.Id, currentPage, totalPages > 0 ? totalPages.ToString() : "?", allRows.Count);

            if (totalPages > 0 && currentPage >= totalPages) break;
            if (pageRows.Count < FetchPageSize) break;
            currentPage++;
        }

        if (finalError is null && allRows.Count > 0)
        {
            // Ensure columns populated (extract from first row if missed)
            if (columns.Count == 0 && allRows.Count > 0) columns = allRows[0].Keys.ToList();

            // Write preview.json
            var previewPath = Path.Combine(env.ContentRootPath, "uploads", "external-sources", $"{job.ExternalSourceId}-preview.json");
            Directory.CreateDirectory(Path.GetDirectoryName(previewPath)!);
            var payload = new { columns, rows = allRows };
            await File.WriteAllTextAsync(previewPath, JsonSerializer.Serialize(payload), context.CancellationToken);

            // Update source metadata
            var src = await db.ExternalSources.FindAsync([job.ExternalSourceId], context.CancellationToken);
            if (src != null)
            {
                src.LastFetchedAt = DateTime.UtcNow;
                src.LastFetchedCount = allRows.Count;
                await db.SaveChangesAsync(context.CancellationToken);
            }
            db.ChangeTracker.Clear();
        }

        // Final status
        using var finalScope = scopeFactory.CreateScope();
        var finalDb = finalScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var finalJob = await finalDb.PreviewJobs.FindAsync([job.Id], context.CancellationToken);
        if (finalJob != null)
        {
            finalJob.Status = finalError is null ? "Completed" : "Failed";
            finalJob.TotalRows = allRows.Count;
            finalJob.ProcessedPages = currentPage;
            finalJob.ErrorMessage = finalError;
            finalJob.CompletedAt = DateTime.UtcNow;
            await finalDb.SaveChangesAsync(context.CancellationToken);
        }

        logger.LogInformation("PreviewJob {JobId} {Status}: {Rows} rows fetched", job.Id, finalError is null ? "Completed" : "Failed", allRows.Count);
    }

    private static async Task FailJob(ApplicationDbContext db, PreviewJob job, string error, CancellationToken ct)
    {
        job.Status = "Failed";
        job.ErrorMessage = error;
        job.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
