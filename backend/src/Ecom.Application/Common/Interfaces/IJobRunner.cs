namespace Ecom.Application.Common.Interfaces;

public interface IJobRunner
{
    string Name { get; }
    string Description { get; }
    int IntervalMinutes { get; }
    Task RunAsync(Func<string, Task> log, CancellationToken ct);
}
