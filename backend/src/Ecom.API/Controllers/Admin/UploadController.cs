using Ecom.API.Services;
using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/upload")]
[Authorize(Roles = "SuperAdmin,Admin,ProductManager,ContentManager")]
[EnableRateLimiting("upload")]
public class UploadController(IStorageService storage, IApplicationDbContext db, ICurrentUserService currentUser) : ControllerBase
{
    private static readonly string[] AllowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    private static readonly string[] AllowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    private static readonly string[] AllowedDocumentTypes = ["application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain", "text/csv"];
    private static readonly string[] AllowedTypes = [.. AllowedImageTypes, .. AllowedVideoTypes, .. AllowedDocumentTypes];
    private const long MaxImageSize = 5 * 1024 * 1024;
    private const long MaxVideoSize = 100 * 1024 * 1024;
    private const long MaxDocumentSize = 20 * 1024 * 1024;

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct,
        [FromQuery] string? entityType = null, [FromQuery] Guid? entityId = null, [FromQuery] string? entityName = null)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Dosya bulunamadı." });

        if (!AllowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Desteklenen formatlar: JPEG, PNG, GIF, WebP, MP4, WebM, PDF, Word, Excel." });

        var isVideo    = AllowedVideoTypes.Contains(file.ContentType);
        var isDocument = AllowedDocumentTypes.Contains(file.ContentType);
        var sizeLimit  = isVideo ? MaxVideoSize : isDocument ? MaxDocumentSize : MaxImageSize;

        if (file.Length > sizeLimit)
            return BadRequest(new { error = isVideo ? "Video en fazla 100 MB olabilir." : isDocument ? "Doküman en fazla 20 MB olabilir." : "Görsel en fazla 5 MB olabilir." });

        var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{ext}";

        await using var stream = file.OpenReadStream();
        var url = await storage.UploadAsync(stream, fileName, file.ContentType, ct);

        var uploaderEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");

        var record = new UploadedFile
        {
            FileName    = file.FileName,
            Url         = url,
            ContentType = file.ContentType,
            FileSize    = file.Length,
            UploadedByEmail = uploaderEmail,
            EntityType  = entityType,
            EntityId    = entityId,
            EntityName  = entityName,
            CreatedByAdminId = currentUser.IsSuperAdmin ? null : currentUser.UserId,
        };
        db.UploadedFiles.Add(record);
        await db.SaveChangesAsync(ct);

        return Ok(new { url, fileId = record.Id });
    }
}
