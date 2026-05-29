using Ecom.API.Filters;
using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Text.Json;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/chatbot")]
[RequiresLicense("Chatbot")]
public class ChatbotController(IMediator mediator, IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig(CancellationToken ct)
    {
        var settings = await mediator.Send(new GetSettingsQuery(), ct);

        if (!settings.TryGetValue("ChatbotEnabled", out var enabledStr) || enabledStr != "true")
            return Ok(new { enabled = false });

        return Ok(new
        {
            enabled = true,
            provider = settings.GetValueOrDefault("ChatbotProvider", "whatsapp"),
            whatsAppNumber = settings.GetValueOrDefault("WhatsAppNumber", ""),
            whatsAppWelcomeMessage = settings.GetValueOrDefault("WhatsAppWelcomeMessage", "Merhaba! Size nasıl yardımcı olabilirim?"),
            telegramBotUsername = settings.GetValueOrDefault("TelegramBotUsername", ""),
            n8nEnabled = !string.IsNullOrWhiteSpace(settings.GetValueOrDefault("N8nWebhookUrl", "")),
        });
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request, CancellationToken ct)
    {
        var settings = await mediator.Send(new GetSettingsQuery(), ct);

        if (!settings.TryGetValue("ChatbotEnabled", out var enabledStr) || enabledStr != "true")
            return BadRequest(new { error = "Chatbot devre dışı." });

        var webhookUrl = settings.GetValueOrDefault("N8nWebhookUrl", "");
        if (string.IsNullOrWhiteSpace(webhookUrl))
            return BadRequest(new { error = "Webhook URL yapılandırılmamış." });

        var payload = new
        {
            message = request.Message,
            customerEmail = request.CustomerEmail,
            sessionId = request.SessionId ?? Guid.NewGuid().ToString(),
            timestamp = DateTime.UtcNow,
        };

        var client = httpClientFactory.CreateClient();

        var apiKey = settings.GetValueOrDefault("N8nApiKey", "");
        if (!string.IsNullOrWhiteSpace(apiKey))
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Api-Key", apiKey);

        var response = await client.PostAsJsonAsync(webhookUrl, payload, ct);
        var responseBody = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            return StatusCode(502, new { error = $"Webhook yanıt vermedi: {response.StatusCode}" });

        try
        {
            var json = JsonDocument.Parse(responseBody);
            return Ok(json.RootElement);
        }
        catch
        {
            return Ok(new { reply = responseBody });
        }
    }

    public record ChatMessageRequest(string Message, string? CustomerEmail = null, string? SessionId = null);
}
