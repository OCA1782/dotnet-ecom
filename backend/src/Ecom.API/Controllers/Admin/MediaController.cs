using Amazon.S3.Model;
using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/media")]
[Authorize(Roles = "SuperAdmin,Admin,ProductManager,ContentManager")]
public class MediaController(
    IMediator mediator,
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IServiceProvider services,
    IWebHostEnvironment env,
    IConfiguration configuration,
    IServiceScopeFactory scopeFactory,
    ILogger<MediaController> logger) : ControllerBase
{
    // ── Images ──────────────────────────────────────────────────────────────

    [HttpGet("images")]
    public async Task<IActionResult> GetImages(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        [FromQuery] string? source = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? isMain = null,
        [FromQuery] bool excludeNoImage = false,
        [FromQuery] string sort = "newest",
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMediaImagesQuery(page, pageSize, source, search, isMain, excludeNoImage, sort), ct);
        return Ok(result);
    }

    [HttpDelete("images/{sourceType}/{id:guid}")]
    public async Task<IActionResult> DeleteImage(string sourceType, Guid id, CancellationToken ct)
    {
        string? deletedUrl = null;

        switch (sourceType.ToLower())
        {
            case "product":
                var pi = await db.ProductImages.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (pi is null) return NotFound();
                deletedUrl = pi.ImageUrl;
                db.ProductImages.Remove(pi);
                break;

            case "category":
                var cat = await db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (cat is null) return NotFound();
                deletedUrl = cat.ImageUrl;
                cat.ImageUrl = null;
                break;

            case "brand":
                var brand = await db.Brands.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (brand is null) return NotFound();
                deletedUrl = brand.LogoUrl;
                brand.LogoUrl = null;
                break;

            case "announcement":
                var ann = await db.Announcements.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (ann is null) return NotFound();
                deletedUrl = ann.MediaUrl;
                ann.MediaUrl = null;
                ann.MediaType = "none";
                break;

            case "user":
                var user = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (user is null) return NotFound();
                deletedUrl = user.AvatarUrl;
                user.AvatarUrl = null;
                break;

            default:
                return BadRequest(new { error = "Geçersiz kaynak türü." });
        }

        if (!string.IsNullOrEmpty(deletedUrl))
        {
            var orphans = await db.UploadedFiles.Where(f => f.Url == deletedUrl).ToListAsync(ct);
            if (orphans.Count > 0) db.UploadedFiles.RemoveRange(orphans);
        }

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Uploaded Files (Documents) ───────────────────────────────────────────

    [HttpGet("files")]
    public async Task<IActionResult> GetFiles(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? type = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var query = db.UploadedFiles.AsQueryable();

        if (!currentUser.HasEffectiveFullAccess && currentUser.UserId.HasValue)
        {
            var adminId = currentUser.UserId.Value;
            var managedEmails = await db.Users
                .Where(u => u.CreatedByAdminId == adminId || u.Id == adminId)
                .Select(u => u.Email)
                .ToListAsync(ct);
            query = query.Where(f =>
                f.CreatedByAdminId == adminId ||
                (f.UploadedByEmail != null && managedEmails.Contains(f.UploadedByEmail)));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(f =>
                f.FileName.ToLower().Contains(s) ||
                (f.EntityName != null && f.EntityName.ToLower().Contains(s)) ||
                (f.UploadedByEmail != null && f.UploadedByEmail.ToLower().Contains(s)));
        }

        if (type == "image")
            query = query.Where(f => f.ContentType.StartsWith("image/"));
        else if (type == "video")
            query = query.Where(f => f.ContentType.StartsWith("video/"));
        else if (type == "document")
            query = query.Where(f => !f.ContentType.StartsWith("image/") && !f.ContentType.StartsWith("video/"));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(f => f.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new
            {
                f.Id, f.FileName, f.Url, f.ContentType, f.FileSize,
                f.UploadedByEmail, f.EntityType, f.EntityId, f.EntityName,
                f.Notes, f.IsOrphaned, f.CreatedDate, f.UpdatedDate
            })
            .ToListAsync(ct);

        return Ok(new
        {
            items,
            totalCount = total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize),
            hasNextPage = page * pageSize < total,
            hasPreviousPage = page > 1
        });
    }

    [HttpPatch("files/{id:guid}")]
    public async Task<IActionResult> UpdateFile(Guid id, [FromBody] UpdateFileRequest req, CancellationToken ct)
    {
        var file = await db.UploadedFiles.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (file is null) return NotFound();
        if (req.Notes is not null) file.Notes = req.Notes;
        if (req.EntityName is not null) file.EntityName = req.EntityName;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("files/{id:guid}")]
    public async Task<IActionResult> DeleteFile(Guid id, CancellationToken ct)
    {
        var file = await db.UploadedFiles.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (file is null) return NotFound();
        var url = file.Url;
        db.UploadedFiles.Remove(file);

        if (!string.IsNullOrEmpty(url))
        {
            var users = await db.Users.Where(u => u.AvatarUrl == url).ToListAsync(ct);
            foreach (var u in users) u.AvatarUrl = null;

            var categories = await db.Categories.Where(c => c.ImageUrl == url).ToListAsync(ct);
            foreach (var c in categories) c.ImageUrl = null;

            var brands = await db.Brands.Where(b => b.LogoUrl == url).ToListAsync(ct);
            foreach (var b in brands) b.LogoUrl = null;

            var announcements = await db.Announcements.Where(a => a.MediaUrl == url).ToListAsync(ct);
            foreach (var a in announcements) { a.MediaUrl = null; a.MediaType = "none"; }

            var productImages = await db.ProductImages.Where(p => p.ImageUrl == url).ToListAsync(ct);
            if (productImages.Count > 0) db.ProductImages.RemoveRange(productImages);

            var campaigns = await db.Campaigns.Where(c => c.ImageUrl == url).ToListAsync(ct);
            foreach (var c in campaigns) c.ImageUrl = null;
        }

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    public record UpdateFileRequest(string? Notes, string? EntityName);

    // ── R2 Content-Type Fix ──────────────────────────────────────────────────
    // Fixes existing R2 objects that were migrated without proper Content-Type.
    // Uses S3 CopyObject-to-self with MetadataDirective=REPLACE.
    // SuperAdmin only — runs in background, check progress via GET endpoint.

    private static volatile string _fixR2State = "idle";
    private static int _fixR2Processed;
    private static int _fixR2Total;
    private static int _fixR2Errors;
    private static string _fixR2LastError = "";

    [HttpPost("fix-r2-content-types")]
    [Authorize(Roles = "SuperAdmin")]
    public IActionResult StartFixR2ContentTypes()
    {
        var s3 = services.GetService<Amazon.S3.IAmazonS3>();
        if (s3 is null)
            return BadRequest(new { error = "R2 yapılandırılmamış. Bu endpoint yalnızca R2 storage aktifken çalışır." });

        if (_fixR2State == "running")
            return Conflict(new { error = "Zaten çalışıyor.", processed = _fixR2Processed, total = _fixR2Total });

        var bucket = configuration["R2:Bucket"] ?? "";
        var publicUrl = configuration["R2:PublicUrl"] ?? "";

        if (string.IsNullOrWhiteSpace(bucket) || string.IsNullOrWhiteSpace(publicUrl))
            return BadRequest(new { error = "R2:Bucket veya R2:PublicUrl yapılandırılmamış." });

        _fixR2State = "running";
        _fixR2Processed = 0;
        _fixR2Total = 0;
        _fixR2Errors = 0;
        _fixR2LastError = "";

        _ = Task.Run(() => RunFixR2ContentTypesAsync(s3, bucket, publicUrl, scopeFactory, logger));

        return Accepted(new
        {
            message = "R2 content-type düzeltme işlemi arka planda başladı.",
            progressUrl = "/api/admin/media/fix-r2-content-types/progress"
        });
    }

    [HttpGet("fix-r2-content-types/progress")]
    [Authorize(Roles = "SuperAdmin")]
    public IActionResult GetFixR2Progress() =>
        Ok(new
        {
            state = _fixR2State,
            processed = _fixR2Processed,
            total = _fixR2Total,
            errors = _fixR2Errors,
            lastError = _fixR2LastError,
            pct = _fixR2Total > 0 ? (int)(_fixR2Processed * 100.0 / _fixR2Total) : 0
        });

    private static async Task RunFixR2ContentTypesAsync(
        Amazon.S3.IAmazonS3 s3, string bucket, string publicUrl,
        IServiceScopeFactory scopeFactory, ILogger logger)
    {
        const string noImageUrl = "https://images.autoforcepart.com/static/autoforcepart-no-image.png";
        var r2Prefix = publicUrl.TrimEnd('/') + "/";
        const int dbPage = 1000;

        try
        {
            // Count total to process
            using (var countScope = scopeFactory.CreateScope())
            {
                var countDb = countScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                _fixR2Total = await countDb.ProductImages
                    .Where(pi => !pi.IsDeleted && pi.ImageUrl.StartsWith(r2Prefix) && pi.ImageUrl != noImageUrl)
                    .CountAsync();
            }

            var semaphore = new SemaphoreSlim(20);
            int offset = 0;

            while (true)
            {
                List<string> urls;
                using (var batchScope = scopeFactory.CreateScope())
                {
                    var batchDb = batchScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                    urls = await batchDb.ProductImages
                        .Where(pi => !pi.IsDeleted && pi.ImageUrl.StartsWith(r2Prefix) && pi.ImageUrl != noImageUrl)
                        .OrderBy(pi => pi.CreatedDate)
                        .Skip(offset)
                        .Take(dbPage)
                        .Select(pi => pi.ImageUrl)
                        .ToListAsync();
                }

                if (urls.Count == 0) break;

                var tasks = urls.Select(url => FixOneR2ObjectAsync(s3, bucket, r2Prefix, url, semaphore)).ToList();
                await Task.WhenAll(tasks);

                offset += urls.Count;
                if (urls.Count < dbPage) break;
            }

            _fixR2State = _fixR2Errors > 0 ? "done-with-errors" : "done";
        }
        catch (Exception ex)
        {
            _fixR2State = "error";
            _fixR2LastError = ex.Message;
            logger.LogError(ex, "R2 content-type fix kritik hata");
        }
    }

    private static async Task FixOneR2ObjectAsync(
        Amazon.S3.IAmazonS3 s3, string bucket, string r2Prefix, string url, SemaphoreSlim semaphore)
    {
        await semaphore.WaitAsync();
        try
        {
            var key = url[r2Prefix.Length..];
            var ext = Path.GetExtension(key).ToLowerInvariant();
            var contentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png"  => "image/png",
                ".gif"  => "image/gif",
                ".webp" => "image/webp",
                ".avif" => "image/avif",
                ".svg"  => "image/svg+xml",
                _       => "image/jpeg",
            };

            await s3.CopyObjectAsync(new CopyObjectRequest
            {
                SourceBucket      = bucket,
                SourceKey         = key,
                DestinationBucket = bucket,
                DestinationKey    = key,
                ContentType       = contentType,
                MetadataDirective = Amazon.S3.S3MetadataDirective.REPLACE,
                Headers           = { CacheControl = "public, max-age=31536000, immutable" },
            });

            Interlocked.Increment(ref _fixR2Processed);
        }
        catch (Exception ex)
        {
            Interlocked.Increment(ref _fixR2Errors);
            _fixR2LastError = ex.Message;
        }
        finally
        {
            semaphore.Release();
        }
    }

    // ── Server Uploads Folder ────────────────────────────────────────────────
    // Lists and cleans up files remaining in wwwroot/uploads on the API server.
    // These should be empty after full R2 migration.

    [HttpGet("server-uploads")]
    [Authorize(Roles = "SuperAdmin")]
    public IActionResult ListServerUploads()
    {
        var uploadsPath = Path.Combine(
            env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"),
            "uploads");

        if (!Directory.Exists(uploadsPath))
            return Ok(new { path = uploadsPath, files = Array.Empty<object>(), totalSizeBytes = 0 });

        var files = Directory.GetFiles(uploadsPath)
            .Select(f => new FileInfo(f))
            .OrderByDescending(fi => fi.LastWriteTimeUtc)
            .Select(fi => new { name = fi.Name, sizeBytes = fi.Length, lastModified = fi.LastWriteTimeUtc })
            .ToList();

        return Ok(new
        {
            path = uploadsPath,
            files,
            totalSizeBytes = files.Sum(f => f.sizeBytes),
            count = files.Count
        });
    }

    [HttpDelete("server-uploads")]
    [Authorize(Roles = "SuperAdmin")]
    public IActionResult DeleteServerUploads([FromQuery] string? except = null)
    {
        var uploadsPath = Path.Combine(
            env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"),
            "uploads");

        if (!Directory.Exists(uploadsPath))
            return Ok(new { deleted = 0, message = "uploads klasörü bulunamadı." });

        var exceptions = (except ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var deleted = 0;
        var errors = new List<string>();
        foreach (var file in Directory.GetFiles(uploadsPath))
        {
            var name = Path.GetFileName(file);
            if (exceptions.Contains(name)) continue;
            try
            {
                System.IO.File.Delete(file);
                deleted++;
            }
            catch (Exception ex)
            {
                errors.Add($"{name}: {ex.Message}");
            }
        }

        return Ok(new { deleted, errors, path = uploadsPath });
    }

    // ── DB Soft-Deleted Image Purge ──────────────────────────────────────────
    // Hard-deletes ProductImage records where IsDeleted=true.
    // Safe — these records are already logically deleted and not visible anywhere.

    [HttpPost("purge-deleted-images")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> PurgeDeletedImages(CancellationToken ct)
    {
        var count = await db.ProductImages
            .IgnoreQueryFilters()
            .Where(pi => pi.IsDeleted)
            .CountAsync(ct);

        if (count == 0)
            return Ok(new { purged = 0, message = "Silinecek soft-deleted ProductImage kaydı yok." });

        // Delete in batches to avoid long-running transactions
        const int batchSize = 5000;
        int totalPurged = 0;

        while (true)
        {
            var batch = await db.ProductImages
                .IgnoreQueryFilters()
                .Where(pi => pi.IsDeleted)
                .Take(batchSize)
                .ToListAsync(ct);

            if (batch.Count == 0) break;

            db.ProductImages.RemoveRange(batch);
            await db.SaveChangesAsync(ct);
            db.ClearChangeTracker();
            totalPurged += batch.Count;
        }

        return Ok(new { purged = totalPurged, message = $"{totalPurged} soft-deleted ProductImage kaydı kalıcı olarak silindi." });
    }
}
