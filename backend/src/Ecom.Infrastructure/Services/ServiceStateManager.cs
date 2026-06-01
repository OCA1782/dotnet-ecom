namespace Ecom.Infrastructure.Services;

public class ServiceState
{
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Type { get; init; } = "BackgroundService";
    public bool IsPaused { get; set; } = false;
    public bool IsRunning { get; set; } = false;
    public bool ManualTriggerRequested { get; set; } = false;
    public DateTime? LastRunAt { get; set; }
    public string? LastRunResult { get; set; }
    public bool? LastRunSuccess { get; set; }
    public int RunCount { get; set; } = 0;
    public DateTime StartedAt { get; init; } = DateTime.UtcNow;
}

public interface IServiceStateManager
{
    void Register(string name, string description, string type = "BackgroundService");
    IReadOnlyList<ServiceState> GetAll();
    ServiceState? Get(string name);
    void SetPaused(string name, bool paused);
    void Trigger(string name);
    bool IsPaused(string name);
    bool ShouldTrigger(string name);
    void RecordRunStart(string name);
    void RecordRunEnd(string name, bool success, string? result = null);
    void SetIntervalOverride(string name, int minutes);
    int GetEffectiveInterval(string name, int defaultMinutes);
}

public class ServiceStateManager : IServiceStateManager
{
    private readonly Dictionary<string, ServiceState> _states = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, int> _intervalOverrides = new(StringComparer.OrdinalIgnoreCase);

    public void Register(string name, string description, string type = "BackgroundService")
    {
        _states[name] = new ServiceState { Name = name, Description = description, Type = type };
    }

    public IReadOnlyList<ServiceState> GetAll() => [.. _states.Values];

    public ServiceState? Get(string name) =>
        _states.TryGetValue(name, out var s) ? s : null;

    public void SetPaused(string name, bool paused)
    {
        if (_states.TryGetValue(name, out var s)) s.IsPaused = paused;
    }

    public void Trigger(string name)
    {
        if (_states.TryGetValue(name, out var s))
        {
            s.ManualTriggerRequested = true;
            s.IsPaused = false;
        }
    }

    public bool IsPaused(string name) =>
        _states.TryGetValue(name, out var s) && s.IsPaused;

    public bool ShouldTrigger(string name)
    {
        if (!_states.TryGetValue(name, out var s) || !s.ManualTriggerRequested) return false;
        s.ManualTriggerRequested = false;
        return true;
    }

    public void RecordRunStart(string name)
    {
        if (_states.TryGetValue(name, out var s)) s.IsRunning = true;
    }

    public void RecordRunEnd(string name, bool success, string? result = null)
    {
        if (_states.TryGetValue(name, out var s))
        {
            s.IsRunning = false;
            s.LastRunAt = DateTime.UtcNow;
            s.LastRunSuccess = success;
            s.LastRunResult = result ?? (success ? "Başarılı" : "Hata");
            s.RunCount++;
        }
    }

    public void SetIntervalOverride(string name, int minutes) =>
        _intervalOverrides[name] = minutes;

    public int GetEffectiveInterval(string name, int defaultMinutes) =>
        _intervalOverrides.TryGetValue(name, out var v) ? v : defaultMinutes;
}
