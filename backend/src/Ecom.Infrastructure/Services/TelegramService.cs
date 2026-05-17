using Ecom.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace Ecom.Infrastructure.Services;

public class TelegramService(HttpClient httpClient, IConfiguration configuration, ILogger<TelegramService> logger) : ITelegramService
{
    private readonly string _botToken = configuration["Telegram:BotToken"] ?? "";
    private readonly string _chatId = configuration["Telegram:DevChatId"] ?? "";

    public async Task SendAsync(string message, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_botToken))
        {
            logger.LogInformation("[TELEGRAM-DEV] {Message}", message);
            return;
        }

        try
        {
            var payload = JsonSerializer.Serialize(new { chat_id = _chatId, text = message });
            var content = new StringContent(payload, Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync(
                $"https://api.telegram.org/bot{_botToken}/sendMessage", content, ct);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[TELEGRAM] Send failed");
        }
    }
}
