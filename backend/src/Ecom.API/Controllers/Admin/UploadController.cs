using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/upload")]
[Authorize(Roles = "SuperAdmin,Admin,ProductManager,ContentManager")]
public class UploadController(IWebHostEnvironment env) : ControllerBase
{
    private static readonly string[] AllowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    private const long MaxSize = 5 * 1024 * 1024; // 5 MB

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Dosya bulunamadı." });

        if (!AllowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Sadece JPEG, PNG, GIF ve WebP desteklenmektedir." });

        if (file.Length > MaxSize)
            return BadRequest(new { error = "Dosya boyutu en fazla 5 MB olabilir." });

        var uploadsPath = Path.Combine(
            env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"),
            "uploads");

        Directory.CreateDirectory(uploadsPath);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream, ct);

        var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
        return Ok(new { url });
    }
}
