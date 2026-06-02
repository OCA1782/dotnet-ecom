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
public class MediaController(IMediator mediator, IApplicationDbContext db) : ControllerBase
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
        switch (sourceType.ToLower())
        {
            case "product":
                var pi = await db.ProductImages.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (pi is null) return NotFound();
                db.ProductImages.Remove(pi);
                break;

            case "category":
                var cat = await db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (cat is null) return NotFound();
                cat.ImageUrl = null;
                break;

            case "brand":
                var brand = await db.Brands.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (brand is null) return NotFound();
                brand.LogoUrl = null;
                break;

            case "announcement":
                var ann = await db.Announcements.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (ann is null) return NotFound();
                ann.MediaUrl = null;
                ann.MediaType = "none";
                break;

            case "user":
                var user = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct);
                if (user is null) return NotFound();
                user.AvatarUrl = null;
                break;

            default:
                return BadRequest(new { error = "Geçersiz kaynak türü." });
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
        db.UploadedFiles.Remove(file);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    public record UpdateFileRequest(string? Notes, string? EntityName);
}
