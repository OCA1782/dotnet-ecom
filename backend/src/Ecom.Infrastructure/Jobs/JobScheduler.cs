using System.Collections.Concurrent;
using System.Text;
using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Jobs;

public class JobScheduler(
    IEnumerable<IJobRunner> jobs,
    IServiceScopeFactory scopeFactory,
    IServiceStateManager stateManager,
    IJobStreamHub hub,
    IConfiguration config,
    ILogger<JobScheduler> logger) : BackgroundService
{
    private readonly IJobRunner[] _jobs = jobs.ToArray();
    private readonly ConcurrentDictionary<string, DateTime> _lastRuns = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, bool> _running = new(StringComparer.OrdinalIgnoreCase);
    private volatile TaskCompletionSource _triggerSignal = new(TaskCreationOptions.RunContinuationsAsynchronously);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        foreach (var job in _jobs)
            stateManager.Register(job.Name, job.Description, "Job");

        logger.LogInformation("JobScheduler başladı — {Count} job kayıtlı.", _jobs.Length);

        // Give LocalDB 60 seconds to warm up before the first job run
        await Task.Delay(60_000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var siteSettings = await LoadSiteSettingsAsync(stoppingToken);
                foreach (var job in _jobs)
                {
                    if (stateManager.IsPaused(job.Name)) continue;
                    if (_running.GetValueOrDefault(job.Name)) continue;

                    var now = DateTime.UtcNow;
                    var lastRun = _lastRuns.GetValueOrDefault(job.Name, DateTime.MinValue);
                    var elapsed = (now - lastRun).TotalMinutes;

                    var isManual = stateManager.ShouldTrigger(job.Name);
                    var effectiveInterval = stateManager.GetEffectiveInterval(job.Name, job.IntervalMinutes);

                    var shouldRun =
                        isManual ||
                        (ShouldAutoRun(job.Name, now, siteSettings) && elapsed >= effectiveInterval);

                    if (shouldRun)
                        _ = Task.Run(() => RunJobAsync(job, isManual: isManual, stoppingToken), stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "JobScheduler döngü hatası — 30s sonra yeniden deneniyor");
            }

            // Wait up to 30s, but wake immediately on a manual trigger signal
            var signal = _triggerSignal.Task;
            await Task.WhenAny(signal, Task.Delay(30_000, stoppingToken));
            if (signal.IsCompleted)
                _triggerSignal = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        }
    }

    public void QueueManualTrigger(string jobName)
    {
        var job = _jobs.FirstOrDefault(j => j.Name.Equals(jobName, StringComparison.OrdinalIgnoreCase));
        if (job == null) throw new InvalidOperationException($"Job bulunamadı: {jobName}");
        if (_running.GetValueOrDefault(jobName)) throw new InvalidOperationException("Job zaten çalışıyor.");
        stateManager.Trigger(jobName);
        _triggerSignal.TrySetResult();
    }

    public async Task TriggerManualAsync(string jobName, CancellationToken ct = default)
    {
        var job = _jobs.FirstOrDefault(j => j.Name.Equals(jobName, StringComparison.OrdinalIgnoreCase));
        if (job == null) throw new InvalidOperationException($"Job bulunamadı: {jobName}");
        if (_running.GetValueOrDefault(jobName)) throw new InvalidOperationException("Job zaten çalışıyor.");
        await RunJobAsync(job, isManual: true, ct);
    }

    private async Task RunJobAsync(IJobRunner job, bool isManual, CancellationToken ct)
    {
        _running[job.Name] = true;
        _lastRuns[job.Name] = DateTime.UtcNow;
        stateManager.RecordRunStart(job.Name);
        hub.CreateChannel(job.Name);

        var logBuilder = new StringBuilder();
        var startTime = DateTime.UtcNow;
        var status = "success";
        string? errorMsg = null;

        async Task Log(string line)
        {
            logBuilder.AppendLine(line);
            await hub.WriteAsync(job.Name, line);
        }

        try
        {
            await Log($"[{DateTime.UtcNow:HH:mm:ss}] ▶ {job.Name} başlıyor{(isManual ? " (manuel)" : "")}");
            await job.RunAsync(Log, ct);
            await Log($"[{DateTime.UtcNow:HH:mm:ss}] ✅ Tamamlandı");
        }
        catch (OperationCanceledException)
        {
            status = "failed";
            errorMsg = "İptal edildi";
            await Log("⚠ İptal edildi");
        }
        catch (Exception ex)
        {
            status = "failed";
            errorMsg = ex.Message;
            await Log($"❌ HATA: {ex.Message}");
            logger.LogError(ex, "Job {Name} başarısız", job.Name);
        }
        finally
        {
            var durationMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
            await Log($"⏱ Süre: {durationMs / 1000.0:F1}s");
            await hub.WriteAsync(job.Name, $"__DONE__{status}");
            hub.Complete(job.Name);
            _running[job.Name] = false;
            stateManager.RecordRunEnd(job.Name, status == "success", $"{status} ({durationMs}ms)");

            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                var output = logBuilder.ToString();
                if (output.Length > 50_000) output = output[..50_000] + "\n... (kesildi)";
                db.JobLogs.Add(new JobLog
                {
                    JobName = job.Name,
                    StartedAt = startTime,
                    FinishedAt = DateTime.UtcNow,
                    Status = status,
                    Output = output,
                    ErrorMessage = errorMsg,
                    DurationMs = durationMs,
                    IsManualTrigger = isManual
                });
                await db.SaveChangesAsync(CancellationToken.None);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "JobLog kaydedilemedi: {Name}", job.Name);
            }
        }
    }
	
	private bool ShouldAutoRun(string jobName, DateTime utcNow, IReadOnlyDictionary<string, string> siteSettings)
	{
		if (!jobName.Contains("I18n", StringComparison.OrdinalIgnoreCase))
			return true;

		var settingsPrefix = jobName.StartsWith("CustomerI18n", StringComparison.OrdinalIgnoreCase)
			? "CustomerI18nJob"
			: "I18nJob";

		if (!ResolveBoolSetting(siteSettings, $"{settingsPrefix}:EnableAutoRun", false))
			return false;

		if (!jobName.EndsWith("DictionaryBuilderJob", StringComparison.OrdinalIgnoreCase))
			return true;

		var timeZoneId = ResolveSetting(siteSettings, $"{settingsPrefix}:ScheduleTimeZone") ?? "Turkey Standard Time";
		var timeZone = ResolveTimeZone(timeZoneId);
		var localNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, timeZone);

		var currentTime = localNow.TimeOfDay;

		var start = ParseTime(ResolveSetting(siteSettings, $"{settingsPrefix}:DictionaryBuilderWindowStart"), new TimeSpan(1, 0, 0));
		var end = ParseTime(ResolveSetting(siteSettings, $"{settingsPrefix}:DictionaryBuilderWindowEnd"), new TimeSpan(7, 0, 0));

		return currentTime >= start && currentTime <= end;
	}

    private async Task<Dictionary<string, string>> LoadSiteSettingsAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        return await db.SiteSettings.ToDictionaryAsync(s => s.Key, s => s.Value, ct);
    }

    private string? ResolveSetting(IReadOnlyDictionary<string, string> siteSettings, string key) =>
        siteSettings.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : config[key];

    private bool ResolveBoolSetting(IReadOnlyDictionary<string, string> siteSettings, string key, bool fallback)
    {
        if (siteSettings.TryGetValue(key, out var value) && bool.TryParse(value, out var parsed))
            return parsed;
        if (bool.TryParse(config[key], out var configParsed))
            return configParsed;
        if (bool.TryParse(Environment.GetEnvironmentVariable(key), out var envParsed))
            return envParsed;
        return fallback;
    }

	private static TimeZoneInfo ResolveTimeZone(string timeZoneId)
	{
		foreach (var candidate in new[] { timeZoneId, "Turkey Standard Time", "Europe/Istanbul", "UTC" })
		{
			try
			{
				return TimeZoneInfo.FindSystemTimeZoneById(candidate);
			}
			catch (TimeZoneNotFoundException) { }
			catch (InvalidTimeZoneException) { }
		}

		return TimeZoneInfo.Utc;
	}

	private static TimeSpan ParseTime(string? value, TimeSpan fallback) =>
		TimeSpan.TryParse(value, out var parsed) ? parsed : fallback;
}
