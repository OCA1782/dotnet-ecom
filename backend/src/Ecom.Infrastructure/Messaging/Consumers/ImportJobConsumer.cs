using Ecom.Application.Events;
using Ecom.Application.Features.Admin;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.Json;

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

    private static async Task FailJob(ApplicationDbContext db, ImportJob job, string error, CancellationToken ct)
    {
        job.Status = "Failed";
        job.ErrorMessage = error;
        job.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
