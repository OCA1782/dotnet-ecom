using Ecom.Application.Events;
using Ecom.Application.Features.Admin;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text.Json;
using System.Web;

namespace Ecom.Infrastructure.Messaging.Consumers;

public class ImportJobConsumer(IServiceScopeFactory scopeFactory, ILogger<ImportJobConsumer> logger)
    : IConsumer<ImportJobQueuedMessage>
{
    private const int ChunkSize = 500;

    public async Task Consume(ConsumeContext<ImportJobQueuedMessage> context)
    {
        var jobId = context.Message.JobId;
        logger.LogInformation("ImportJob {JobId} received, starting processing", jobId);

        // Resolve job data
        using var outerScope = scopeFactory.CreateScope();
        var outerDb = outerScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var job = await outerDb.ImportJobs
            .Include(j => j.ExternalSource)
            .FirstOrDefaultAsync(j => j.Id == jobId, context.CancellationToken);

        if (job is null)
        {
            logger.LogWarning("ImportJob {JobId} not found", jobId);
            return;
        }

        // Mark as processing
        job.Status = "Processing";
        job.StartedAt = DateTime.UtcNow;
        await outerDb.SaveChangesAsync(context.CancellationToken);
        outerDb.ChangeTracker.Clear();

        // Fetch-and-import mode: consumer fetches all pages from source server-side
        if (job.PayloadJson == "FETCH_FROM_SOURCE")
        {
            Dictionary<string, string> fetchFieldMapping;
            try { fetchFieldMapping = JsonSerializer.Deserialize<Dictionary<string, string>>(job.FieldMappingJson) ?? []; }
            catch (Exception ex)
            {
                await FailJob(outerDb, job, $"FieldMapping deserialization failed: {ex.Message}", context.CancellationToken);
                return;
            }
            await FetchAndImportAsync(job, fetchFieldMapping, outerScope, scopeFactory, context.CancellationToken, logger);
            return;
        }

        List<Dictionary<string, string>> allRows;
        Dictionary<string, string> fieldMapping;
        try
        {
            allRows = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(job.PayloadJson)
                      ?? new List<Dictionary<string, string>>();
            fieldMapping = JsonSerializer.Deserialize<Dictionary<string, string>>(job.FieldMappingJson)
                           ?? new Dictionary<string, string>();
        }
        catch (Exception ex)
        {
            await FailJob(outerDb, job, $"Payload deserialization failed: {ex.Message}", context.CancellationToken);
            return;
        }

        int totalIns = 0, totalUpd = 0, totalSkip = 0;
        var totalSkipReasons = new Dictionary<string, int>();
        string? finalError = null;
        var chunks = Enumerable
            .Range(0, (int)Math.Ceiling((double)allRows.Count / ChunkSize))
            .Select(i => allRows.Skip(i * ChunkSize).Take(ChunkSize).ToList())
            .ToList();

        for (int i = 0; i < chunks.Count; i++)
        {
            // Check for cancellation before every chunk (set by CancelImportJobCommand or source delete)
            var cancelCheck = await outerDb.ImportJobs
                .AsNoTracking()
                .Where(j => j.Id == jobId)
                .Select(j => j.Status)
                .FirstOrDefaultAsync(context.CancellationToken);

            if (cancelCheck == "Cancelled")
            {
                logger.LogInformation("ImportJob {JobId} was cancelled, stopping at chunk {Chunk}", jobId, i + 1);
                return;
            }

            try
            {
                // Each chunk runs in its own scope → fresh DbContext → no change tracker bloat
                using var chunkScope = scopeFactory.CreateScope();
                var chunkProcessor = chunkScope.ServiceProvider.GetRequiredService<ImportBatchProcessor>();

                var (ins, upd, skip, skipReasons) = await chunkProcessor.ProcessAsync(
                    job.TargetEntity, chunks[i], fieldMapping, job.ConflictStrategy,
                    context.CancellationToken, job.ExternalSourceId);

                totalIns += ins; totalUpd += upd; totalSkip += skip;
                foreach (var (k, v) in skipReasons)
                    totalSkipReasons[k] = totalSkipReasons.TryGetValue(k, out var ex) ? ex + v : v;

                // Update progress on the outer scope's tracked job
                var progressDb = outerScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var tracked = await progressDb.ImportJobs.FindAsync([jobId], context.CancellationToken);
                if (tracked is not null)
                {
                    tracked.ProcessedRows = Math.Min((i + 1) * ChunkSize, allRows.Count);
                    tracked.InsertedCount = totalIns;
                    tracked.UpdatedCount = totalUpd;
                    tracked.SkippedCount = totalSkip;
                    await progressDb.SaveChangesAsync(context.CancellationToken);
                    progressDb.ChangeTracker.Clear();
                }

                logger.LogInformation("ImportJob {JobId}: chunk {Chunk}/{Total} done (+{Ins} ~{Upd} ⊘{Skip})",
                    jobId, i + 1, chunks.Count, ins, upd, skip);
            }
            catch (Exception ex)
            {
                finalError = $"Chunk {i + 1}/{chunks.Count} failed: {ex.Message}";
                logger.LogError(ex, "ImportJob {JobId} failed at chunk {Chunk}", jobId, i + 1);
                break;
            }
        }

        // Write final status + ExternalSourceImportLog
        using var finalScope = scopeFactory.CreateScope();
        var finalDb = finalScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var finalJob = await finalDb.ImportJobs.FindAsync([jobId], context.CancellationToken);
        if (finalJob is not null)
        {
            finalJob.Status = finalError is null ? "Completed" : "Failed";
            finalJob.ProcessedRows = allRows.Count;
            finalJob.InsertedCount = totalIns;
            finalJob.UpdatedCount = totalUpd;
            finalJob.SkippedCount = totalSkip;
            finalJob.ErrorMessage = finalError;
            finalJob.CompletedAt = DateTime.UtcNow;
        }

        finalDb.ExternalSourceImportLogs.Add(new ExternalSourceImportLog
        {
            ExternalSourceId = job.ExternalSourceId,
            TargetEntity = job.TargetEntity,
            InsertedCount = totalIns,
            UpdatedCount = totalUpd,
            SkippedCount = totalSkip,
            ErrorMessage = finalError,
            ImportedByUserId = job.RequestedByUserId,
            TotalRows = allRows.Count,
            ConflictStrategy = job.ConflictStrategy,
            SkipDiagnosticsJson = totalSkipReasons.Count > 0
                ? JsonSerializer.Serialize(totalSkipReasons) : null,
        });

        await finalDb.SaveChangesAsync(context.CancellationToken);

        logger.LogInformation("ImportJob {JobId} {Status}: +{Ins} ~{Upd} ⊘{Skip}",
            jobId, finalError is null ? "Completed" : "Failed", totalIns, totalUpd, totalSkip);
    }

    private static async Task FetchAndImportAsync(
        ImportJob job,
        Dictionary<string, string> fieldMapping,
        IServiceScope outerScope,
        IServiceScopeFactory scopeFactory,
        CancellationToken ct,
        ILogger logger)
    {
        var progressDb = outerScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var httpFactory = outerScope.ServiceProvider.GetRequiredService<IHttpClientFactory>();

        // Load source config
        var source = await progressDb.ExternalSources.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == job.ExternalSourceId, ct);
        if (source is null || string.IsNullOrWhiteSpace(source.Config))
        {
            await FailJob(progressDb, job, "Kaynak bulunamadı veya config eksik.", ct);
            return;
        }

        JsonElement cfg;
        try { cfg = JsonDocument.Parse(source.Config).RootElement; }
        catch { await FailJob(progressDb, job, "Config geçersiz JSON.", ct); return; }

        if (!cfg.TryGetProperty("url", out var urlEl))
        {
            await FailJob(progressDb, job, "Config'de URL bulunamadı.", ct);
            return;
        }

        var baseUrl = urlEl.GetString()!;
        var pageParam = cfg.TryGetProperty("pageParam", out var pp) ? pp.GetString() ?? "page" : "page";
        var psParam = cfg.TryGetProperty("pageSizeParam", out var psp) ? psp.GetString() ?? "pageSize" : "pageSize";
        var dataPath = cfg.TryGetProperty("dataPath", out var dp) ? dp.GetString() : null;

        const int BulkPageSize = 1000;

        using var client = httpFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(60);
        if (cfg.TryGetProperty("headers", out var hdrs) && hdrs.ValueKind == JsonValueKind.Object)
            foreach (var kv in hdrs.EnumerateObject())
                client.DefaultRequestHeaders.TryAddWithoutValidation(kv.Name, kv.Value.GetString());

        int totalPages = 0;
        int currentPage = 1;
        int totalIns = 0, totalUpd = 0, totalSkip = 0, totalDel = 0;
        var skipReasons = new Dictionary<string, int>();
        string? finalError = null;
        // Accumulate product IDs seen across all pages (for sync-delete pass after import)
        HashSet<Guid>? allTouchedProductIds = job.SyncDelete && job.TargetEntity == "Product" ? [] : null;

        while (true)
        {
            // Cancellation check
            var currentStatus = await progressDb.ImportJobs.AsNoTracking()
                .Where(j => j.Id == job.Id).Select(j => j.Status).FirstOrDefaultAsync(ct);
            if (currentStatus == "Cancelled")
            {
                logger.LogInformation("FetchAndImportJob {JobId} cancelled at page {Page}", job.Id, currentPage);
                return;
            }

            // Build paginated URL
            var ub = new UriBuilder(baseUrl);
            var qs = HttpUtility.ParseQueryString(ub.Query);
            qs[pageParam] = currentPage.ToString();
            qs[psParam] = BulkPageSize.ToString();
            ub.Query = qs.ToString();

            HttpResponseMessage response;
            try { response = await client.GetAsync(ub.ToString(), ct); }
            catch (Exception ex) { finalError = $"Bağlantı hatası (sayfa {currentPage}): {ex.Message}"; break; }

            if (!response.IsSuccessStatusCode)
            {
                finalError = $"HTTP {(int)response.StatusCode} (sayfa {currentPage})";
                break;
            }

            var jsonStr = await response.Content.ReadAsStringAsync(ct);
            JsonDocument doc;
            try { doc = JsonDocument.Parse(jsonStr); }
            catch { finalError = $"JSON parse hatası (sayfa {currentPage})"; break; }

            var rootFull = doc.RootElement;

            // Extract pagination metadata on first page
            if (currentPage == 1 && rootFull.ValueKind == JsonValueKind.Object)
            {
                int? tc_ = null;
                if (rootFull.TryGetProperty("totalCount", out var tc) && tc.ValueKind == JsonValueKind.Number)
                    tc_ = tc.GetInt32();
                if (rootFull.TryGetProperty("totalPages", out var tp) && tp.ValueKind == JsonValueKind.Number)
                    totalPages = tp.GetInt32();
                if (totalPages == 0 && tc_.HasValue)
                    totalPages = (int)Math.Ceiling((double)tc_.Value / BulkPageSize);
                if (tc_.HasValue)
                {
                    var tracked = await progressDb.ImportJobs.FindAsync([job.Id], ct);
                    if (tracked != null) { tracked.TotalRows = tc_.Value; await progressDb.SaveChangesAsync(ct); }
                    progressDb.ChangeTracker.Clear();
                }
            }

            // Navigate data path
            var dataRoot = rootFull;
            if (!string.IsNullOrWhiteSpace(dataPath))
            {
                try { foreach (var part in dataPath!.Split('.')) dataRoot = dataRoot.GetProperty(part); }
                catch { finalError = $"DataPath '{dataPath}' bulunamadı (sayfa {currentPage})"; break; }
            }

            if (dataRoot.ValueKind != JsonValueKind.Array)
            {
                finalError = "Veri dizisi bulunamadı — DataPath kontrol edin";
                break;
            }

            var rows = new List<Dictionary<string, string>>();
            foreach (var item in dataRoot.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object) continue;
                var row = new Dictionary<string, string>();
                foreach (var prop in item.EnumerateObject())
                    row[prop.Name] = prop.Value.ValueKind == JsonValueKind.Null ? "" : prop.Value.ToString();
                rows.Add(row);
            }

            if (rows.Count == 0) break;

            // Process this page with a fresh scope
            try
            {
                using var chunkScope = scopeFactory.CreateScope();
                var processor = chunkScope.ServiceProvider.GetRequiredService<ImportBatchProcessor>();
                var (ins, upd, skip, sr) = await processor.ProcessAsync(
                    job.TargetEntity, rows, fieldMapping, job.ConflictStrategy, ct, job.ExternalSourceId, allTouchedProductIds);

                totalIns += ins; totalUpd += upd; totalSkip += skip;
                foreach (var (k, v) in sr)
                    skipReasons[k] = skipReasons.TryGetValue(k, out var existing) ? existing + v : v;
            }
            catch (Exception ex)
            {
                // Record first page error but continue — one bad page must not abort the full import.
                var pageErr = $"Sayfa {currentPage} atlandı: {ex.Message}";
                finalError ??= pageErr;
                logger.LogWarning(ex, "FetchAndImportJob {JobId} failed at page {Page}, continuing", job.Id, currentPage);
                if (totalPages > 0 && currentPage >= totalPages) break;
                if (rows.Count < BulkPageSize) break;
                currentPage++;
                continue;
            }

            // Update progress
            var progressTracked = await progressDb.ImportJobs.FindAsync([job.Id], ct);
            if (progressTracked != null)
            {
                progressTracked.ProcessedRows += rows.Count;
                progressTracked.InsertedCount = totalIns;
                progressTracked.UpdatedCount = totalUpd;
                progressTracked.SkippedCount = totalSkip;
                await progressDb.SaveChangesAsync(ct);
            }
            progressDb.ChangeTracker.Clear();

            logger.LogInformation("FetchAndImportJob {JobId}: page {Page}/{Total} (+{Ins} ~{Upd} ⊘{Skip})",
                job.Id, currentPage, totalPages > 0 ? totalPages.ToString() : "?", totalIns, totalUpd, totalSkip);

            if (totalPages > 0 && currentPage >= totalPages) break;
            if (rows.Count < BulkPageSize) break; // last page is partial
            currentPage++;
        }

        // Sync-delete pass: soft-delete products from this source absent in current import
        if (finalError is null && allTouchedProductIds is not null && job.ExternalSourceId != Guid.Empty)
        {
            try
            {
                using var syncScope = scopeFactory.CreateScope();
                var syncDb = syncScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var staleProducts = await syncDb.Products
                    .Where(p => p.ImportedFromSourceId == job.ExternalSourceId
                                && !p.IsDeleted
                                && !allTouchedProductIds.Contains(p.Id))
                    .ToListAsync(ct);

                foreach (var p in staleProducts)
                    p.IsDeleted = true;

                if (staleProducts.Count > 0)
                    await syncDb.SaveChangesAsync(ct);

                totalDel = staleProducts.Count;
                logger.LogInformation("FetchAndImportJob {JobId} sync-delete: {Count} stale products soft-deleted", job.Id, totalDel);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "FetchAndImportJob {JobId} sync-delete pass failed", job.Id);
            }
        }

        // Write final status + import log
        using var finalScope = scopeFactory.CreateScope();
        var finalDb = finalScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var finalJob = await finalDb.ImportJobs.FindAsync([job.Id], ct);
        if (finalJob != null)
        {
            finalJob.Status = finalError is null ? "Completed" : "Failed";
            finalJob.InsertedCount = totalIns;
            finalJob.UpdatedCount = totalUpd;
            finalJob.SkippedCount = totalSkip;
            finalJob.ErrorMessage = finalError;
            finalJob.CompletedAt = DateTime.UtcNow;
        }

        finalDb.ExternalSourceImportLogs.Add(new ExternalSourceImportLog
        {
            ExternalSourceId = job.ExternalSourceId,
            TargetEntity = job.TargetEntity,
            InsertedCount = totalIns,
            UpdatedCount = totalUpd,
            SkippedCount = totalSkip,
            DeletedCount = totalDel,
            ErrorMessage = finalError,
            ImportedByUserId = job.RequestedByUserId,
            TotalRows = finalJob?.TotalRows > 0 ? finalJob.TotalRows : totalIns + totalUpd + totalSkip,
            ConflictStrategy = job.ConflictStrategy,
            SkipDiagnosticsJson = skipReasons.Count > 0 ? JsonSerializer.Serialize(skipReasons) : null,
        });

        await finalDb.SaveChangesAsync(ct);
        logger.LogInformation("FetchAndImportJob {JobId} {Status}: +{Ins} ~{Upd} ⊘{Skip} 🗑{Del}",
            job.Id, finalError is null ? "Completed" : "Failed", totalIns, totalUpd, totalSkip, totalDel);
    }

    private static async Task FailJob(ApplicationDbContext db, ImportJob job, string error, CancellationToken ct)
    {
        job.Status = "Failed";
        job.ErrorMessage = error;
        job.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
