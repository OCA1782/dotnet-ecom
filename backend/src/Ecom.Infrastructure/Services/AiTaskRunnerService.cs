using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;

namespace Ecom.Infrastructure.Services;

public sealed class AiTaskRunnerService(
    IServiceScopeFactory scopeFactory,
    ILogger<AiTaskRunnerService> logger,
    IConfiguration config,
    IHttpClientFactory httpClientFactory
) : BackgroundService, IAiTaskQueue
{
    private readonly Channel<Guid> _channel = Channel.CreateBounded<Guid>(new BoundedChannelOptions(100)
    {
        FullMode = BoundedChannelFullMode.Wait,
        SingleReader = true,
    });

    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> _activeCts = new();

    public void Enqueue(Guid taskId)
    {
        _channel.Writer.TryWrite(taskId);
    }

    public void Cancel(Guid taskId)
    {
        if (_activeCts.TryGetValue(taskId, out var cts))
            cts.Cancel();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var taskId in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            _activeCts[taskId] = cts;
            try
            {
                await ProcessTaskAsync(taskId, cts.Token);
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                logger.LogError(ex, "AI task {TaskId} failed unexpectedly", taskId);
                await MarkFailedAsync(taskId, ex.Message, stoppingToken);
            }
            finally
            {
                _activeCts.TryRemove(taskId, out _);
            }
        }
    }

    private async Task ProcessTaskAsync(Guid taskId, CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var task = await db.AiTasks
            .Include(t => t.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task is null) return;

        var apiKey = config["Anthropic:ApiKey"] ?? "";
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            task.Status = "Failed";
            task.ErrorMessage = "Anthropic API anahtarı yapılandırılmamış. appsettings.json → Anthropic:ApiKey";
            task.CompletedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return;
        }

        var content = new List<object>();

        foreach (var img in task.Images)
        {
            try
            {
                var client = httpClientFactory.CreateClient();
                var bytes = await client.GetByteArrayAsync(img.ImageUrl, ct);
                var b64 = Convert.ToBase64String(bytes);
                var mime = DetectMime(img.ImageUrl, img.FileName);
                content.Add(new
                {
                    type = "image",
                    source = new { type = "base64", media_type = mime, data = b64 }
                });
            }
            catch (Exception ex)
            {
                logger.LogWarning("Could not load image {Url}: {Msg}", img.ImageUrl, ex.Message);
            }
        }

        content.Add(new { type = "text", text = BuildPrompt(task.Type, task.Title, task.Description) });

        var requestBody = new
        {
            model = "claude-sonnet-4-6",
            max_tokens = 8192,
            messages = new[]
            {
                new { role = "user", content }
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        var http = httpClientFactory.CreateClient();
        http.DefaultRequestHeaders.Add("x-api-key", apiKey);
        http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        using var httpContent = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await http.PostAsync("https://api.anthropic.com/v1/messages", httpContent, ct);

        if (!response.IsSuccessStatusCode)
        {
            var errBody = await response.Content.ReadAsStringAsync(ct);
            task.Status = "Failed";
            task.ErrorMessage = $"API hatası {(int)response.StatusCode}: {errBody[..Math.Min(500, errBody.Length)]}";
            task.CompletedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return;
        }

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(responseJson);
        var resultText = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "";

        task.Status = "Completed";
        task.ResultText = resultText;
        task.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task MarkFailedAsync(Guid taskId, string message, CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var task = await db.AiTasks.FirstOrDefaultAsync(t => t.Id == taskId, ct);
            if (task is null) return;
            task.Status = "Failed";
            task.ErrorMessage = message;
            task.CompletedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        catch { }
    }

    private static string BuildPrompt(string type, string title, string description)
    {
        var typeContext = type switch
        {
            "Bug" => "Bu bir hata (bug) kaydıdır. Lütfen ekran görüntülerini inceleyerek sorunu analiz et, kök nedenini belirle ve çözüm öner.",
            "Feature" => "Bu bir özellik talebidir. Lütfen gereksinimleri analiz et ve nasıl uygulanabileceğini açıkla.",
            "Analysis" => "Bu bir analiz görevidir. Lütfen görselleri ve açıklamayı dikkatlice inceleyerek ayrıntılı analiz sun.",
            "Refactor" => "Bu bir yeniden yapılandırma görevidir. Kodu veya yapıyı nasıl iyileştirebileceğini açıkla.",
            "Review" => "Bu bir inceleme görevidir. İçeriği gözden geçir ve geri bildirim sun.",
            "Design" => "Bu bir tasarım görevidir. Tasarım önerileri ve iyileştirmeleri belirt.",
            _ => "Bu bir görev kaydıdır. Lütfen içeriği analiz et ve sonuçları açıkla.",
        };

        return $"""
            {typeContext}

            Başlık: {title}

            Açıklama:
            {description}

            Lütfen Türkçe yanıt ver.
            """;
    }

    private static string DetectMime(string url, string fileName)
    {
        var ext = Path.GetExtension(fileName.Length > 0 ? fileName : url).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "image/png",
        };
    }
}
