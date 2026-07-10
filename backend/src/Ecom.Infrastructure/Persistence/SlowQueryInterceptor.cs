using System.Collections.Concurrent;
using System.Data.Common;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Persistence;

public record SlowQueryEntry(DateTime OccurredAt, long DurationMs, string CommandText, string? CommandType);

/// <summary>
/// Logs queries that exceed the threshold and keeps a ring buffer of recent slow queries.
/// Works for both SQL Server and PostgreSQL — provider-agnostic EF Core interceptor.
/// </summary>
public class SlowQueryInterceptor(ILogger<SlowQueryInterceptor> logger) : DbCommandInterceptor
{
    private const int ThresholdMs = 500;
    private const int MaxEntries = 100;

    private static readonly ConcurrentQueue<SlowQueryEntry> _entries = new();
    private static int _totalCount;

    public static IReadOnlyCollection<SlowQueryEntry> RecentSlowQueries => _entries.ToArray();
    public static int TotalSlowQueryCount => _totalCount;

    public override ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken cancellationToken = default)
    {
        RecordIfSlow(command, eventData.Duration);
        return new ValueTask<DbDataReader>(result);
    }

    public override ValueTask<object?> ScalarExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        object? result,
        CancellationToken cancellationToken = default)
    {
        RecordIfSlow(command, eventData.Duration);
        return new ValueTask<object?>(result);
    }

    public override ValueTask<int> NonQueryExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        RecordIfSlow(command, eventData.Duration);
        return new ValueTask<int>(result);
    }

    public override DbDataReader ReaderExecuted(DbCommand command, CommandExecutedEventData eventData, DbDataReader result)
    {
        RecordIfSlow(command, eventData.Duration);
        return result;
    }

    public override object? ScalarExecuted(DbCommand command, CommandExecutedEventData eventData, object? result)
    {
        RecordIfSlow(command, eventData.Duration);
        return result;
    }

    public override int NonQueryExecuted(DbCommand command, CommandExecutedEventData eventData, int result)
    {
        RecordIfSlow(command, eventData.Duration);
        return result;
    }

    private void RecordIfSlow(DbCommand command, TimeSpan duration)
    {
        if (duration.TotalMilliseconds < ThresholdMs) return;

        var ms = (long)duration.TotalMilliseconds;
        var sql = command.CommandText;
        var cmdType = command.CommandType.ToString();

        logger.LogWarning("SLOW_QUERY [{DurationMs}ms] {Sql}", ms, sql.Length > 500 ? sql[..500] + "…" : sql);

        Interlocked.Increment(ref _totalCount);

        _entries.Enqueue(new SlowQueryEntry(DateTime.UtcNow, ms, sql.Length > 2000 ? sql[..2000] + "…" : sql, cmdType));
        while (_entries.Count > MaxEntries)
            _entries.TryDequeue(out _);
    }
}
