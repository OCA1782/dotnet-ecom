using Ecom.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/upload")]
[Authorize(Roles = "SuperAdmin,Admin,ProductManager,ContentManager")]
[EnableRateLimiting("upload")]
public class UploadController(IStorageService storage) : ControllerBase
{
    private static readonly string[] AllowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    private static readonly string[] AllowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    private static readonly string[] AllowedTypes = [.. AllowedImageTypes, .. AllowedVideoTypes];
    private const long MaxImageSize = 5 * 1024 * 1024;
    private const long MaxVideoSize = 100 * 1024 * 1024;

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Dosya bulunamadı." });

        if (!AllowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Desteklenen formatlar: JPEG, PNG, GIF, WebP, MP4, WebM." });

        var isVideo = AllowedVideoTypes.Contains(file.ContentType);
        var sizeLimit = isVideo ? MaxVideoSize : MaxImageSize;
        if (file.Length > sizeLimit)
            return BadRequest(new { error = isVideo ? "Video dosyası en fazla 100 MB olabilir." : "Görsel dosyası en fazla 5 MB olabilir." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{ext}";

        await using var stream = file.OpenReadStream();
        var url = await storage.UploadAsync(stream, fileName, file.ContentType, ct);
        return Ok(new { url });
    }
}
