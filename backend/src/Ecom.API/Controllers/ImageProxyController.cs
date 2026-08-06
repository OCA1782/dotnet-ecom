using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

/// <summary>
/// Üçüncü taraf sunuculardaki ürün görsellerini kendi domain'imizden serve eder.
/// Google Merchant Center bu endpoint'e erişebilir; hotlinking korumalı
/// kaynak sunuculardaki görseller de bu proxy üzerinden ulaşılabilir hale gelir.
/// Sunucu taraflı önbellek yok — Cache-Control: public header ile nginx/CDN katmanı önbelleğe alır.
/// </summary>
[ApiController]
public class ImageProxyController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    private const int MaxImageBytes = 10 * 1024 * 1024; // 10 MB

    private static readonly HashSet<string> AllowedSchemes =
        new(StringComparer.OrdinalIgnoreCase) { "http", "https" };

    private static readonly string[] BlockedHostPrefixes =
        ["localhost", "127.", "::1", "0.0.0.0", "169.254.", "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.2", "172.3"];

    [HttpGet("/api/images/proxy")]
    [AllowAnonymous]
    public async Task<IActionResult> Proxy([FromQuery] string url, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequest();

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)
            || !AllowedSchemes.Contains(uri.Scheme))
            return BadRequest();

        // SSRF koruması — iç ağ adreslerine erişimi engelle
        if (BlockedHostPrefixes.Any(p => uri.Host.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
            return BadRequest();

        try
        {
            var client = httpClientFactory.CreateClient("ImageProxy");
            using var resp = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!resp.IsSuccessStatusCode)
                return StatusCode((int)resp.StatusCode);

            var contentType = resp.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
            if (!contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return BadRequest();

            var data = await resp.Content.ReadAsByteArrayAsync(ct);
            if (data.Length > MaxImageBytes)
                return StatusCode(StatusCodes.Status413RequestEntityTooLarge);

            // nginx/CDN 24 saat önbelleğe alır; sunucu belleği tüketilmez
            Response.Headers["Cache-Control"] = "public, max-age=86400";
            return File(data, contentType);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(StatusCodes.Status504GatewayTimeout);
        }
        catch
        {
            return NotFound();
        }
    }
}
