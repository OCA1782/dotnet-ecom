namespace Ecom.API.Services;

public class LocalStorageService(IWebHostEnvironment env, IHttpContextAccessor http, IConfiguration config) : IStorageService
{
    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        var uploadsPath = Path.Combine(
            env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"),
            "uploads");
        Directory.CreateDirectory(uploadsPath);

        var filePath = Path.Combine(uploadsPath, fileName);
        await using var fs = new FileStream(filePath, FileMode.Create);
        await stream.CopyToAsync(fs, ct);

        // Explicit public base URL takes priority (set via Storage:PublicBaseUrl in config)
        var publicBase = config["Storage:PublicBaseUrl"]?.TrimEnd('/');
        if (!string.IsNullOrEmpty(publicBase))
            return $"{publicBase}/uploads/{fileName}";

        // Respect reverse-proxy forwarded headers (nginx)
        var req = http.HttpContext?.Request;
        if (req != null)
        {
            var proto = req.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? req.Scheme;
            var host  = req.Headers["X-Forwarded-Host"].FirstOrDefault() ?? req.Host.ToString();
            return $"{proto}://{host}/uploads/{fileName}";
        }

        return $"/uploads/{fileName}";
    }
}
