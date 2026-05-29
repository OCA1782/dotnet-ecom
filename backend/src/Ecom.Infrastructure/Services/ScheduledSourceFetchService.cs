using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
namespace Ecom.Infrastructure.Services;

public class ScheduledSourceFetchService(
    IServiceScopeFactory scopeFactory,
    IServiceStateManager serviceManager,
    ILogger<ScheduledSourceFetchService> logger)
    : BackgroundService
{
    private const string ServiceName = "ScheduledSourceFetch";

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        serviceManager.Register(ServiceName, "Dış kaynak otomatik veri çekme servisi (5 dk'da bir)");
        return base.StartAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));

        while (!stoppingToken.IsCancellationRequested)
        {
            bool triggered = serviceManager.ShouldTrigger(ServiceName);

            if (triggered || await WaitForTickOrTrigger(timer, stoppingToken))
            {
                if (serviceManager.IsPaused(ServiceName))
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken).ContinueWith(_ => { }, CancellationToken.None);
                    continue;
                }

                serviceManager.RecordRunStart(ServiceName);
                try
                {
                    await RunDueSourcesAsync(stoppingToken);
                    serviceManager.RecordRunEnd(ServiceName, true);
                }
                catch (Exception ex)
                {
                    serviceManager.RecordRunEnd(ServiceName, false, ex.Message[..Math.Min(100, ex.Message.Length)]);
                    logger.LogError(ex, "ScheduledSourceFetchService error");
                }
            }
        }
    }

    private static async Task<bool> WaitForTickOrTrigger(PeriodicTimer timer, CancellationToken ct)
    {
        try { return await timer.WaitForNextTickAsync(ct); }
        catch (OperationCanceledException) { return false; }
    }

    private async Task RunDueSourcesAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        var now = DateTime.UtcNow;
        var due = await db.ExternalSources
            .Where(s => s.IsActive
                && s.FetchSchedule != "None"
                && s.Type == "RestApi"
                && (s.NextScheduledFetchAt == null || s.NextScheduledFetchAt <= now))
            .ToListAsync(ct);

        foreach (var source in due)
        {
            logger.LogInformation("Scheduled fetch: {Source} ({Schedule})", source.Name, source.FetchSchedule);
            try
            {
                var fetchResult = await mediator.Send(new FetchExternalSourceCommand(source.Id), ct);

                if (fetchResult.Error is null && !string.IsNullOrWhiteSpace(source.AutoImportTarget) && fetchResult.Rows.Count > 0)
                {
                    var importResult = await mediator.Send(new ImportExternalSourceCommand(
                        source.Id,
                        source.AutoImportTarget,
                        fetchResult.Rows,
                        new Dictionary<string, string>(),
                        "skip",
                        null), ct);

                    source.LastAutoImportAt = DateTime.UtcNow;
                    logger.LogInformation("Auto-import: {Source} → {Target}: +{Ins} ~{Upd} ⊘{Skip}",
                        source.Name, source.AutoImportTarget,
                        importResult.InsertedCount, importResult.UpdatedCount, importResult.SkippedCount);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Scheduled fetch error: {Source}", source.Name);
            }

            source.NextScheduledFetchAt = ComputeNext(source.FetchSchedule);
            await db.SaveChangesAsync(ct);
        }
    }

    private static DateTime? ComputeNext(string schedule) => schedule switch
    {
        "Hourly" => DateTime.UtcNow.AddHours(1),
        "Daily"  => DateTime.UtcNow.AddDays(1),
        "Weekly" => DateTime.UtcNow.AddDays(7),
        _        => null,
    };
}
