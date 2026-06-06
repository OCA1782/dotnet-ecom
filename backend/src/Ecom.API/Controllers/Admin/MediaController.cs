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
public class MediaController(IMediator mediator, IApplicationDbContext db, ICurrentUserService currentUser) : ControllerBase
{
    // ── Images ──────────────────────────────────────────────────────────────

    [HttpGet("images")]
    public async Task<IActionResult> GetImages(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        [FromQuery] string? source = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? isMain = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMediaImagesQuery(page, pageSize, source, search, isMain), ct);
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

        // Cascade: aynı URL'e sahip UploadedFiles kayıtlarını sil
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
        [FromQuery] string? type = null,    // image | video | document
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var query = db.UploadedFiles.AsQueryable();

        if (!currentUser.IsSuperAdmin && currentUser.UserId.HasValue)
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

        // Cascade: bu URL'i kullanan entity alanlarını temizle
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
}
