namespace Ecom.API.Services;

public class LocalStorageService(IWebHostEnvironment env, IHttpContextAccessor http) : IStorageService
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

        var req = http.HttpContext?.Request;
        return req != null
            ? $"{req.Scheme}://{req.Host}/uploads/{fileName}"
            : $"/uploads/{fileName}";
    }
}
