using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record MediaImageDto(
    Guid Id,
    string Url,
    string SourceType,   // product | category | brand | announcement
    Guid SourceId,
    string SourceName,
    string? AltText,
    bool IsMain,
    int SortOrder,
    DateTime CreatedDate
);

public record GetMediaImagesQuery(
    int Page = 1,
    int PageSize = 24,
    string? SourceType = null,
    string? Search = null,
    bool? IsMain = null
) : IRequest<PaginatedList<MediaImageDto>>;

public class GetMediaImagesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMediaImagesQuery, PaginatedList<MediaImageDto>>
{
    public async Task<PaginatedList<MediaImageDto>> Handle(GetMediaImagesQuery request, CancellationToken cancellationToken)
    {
        var all = new List<MediaImageDto>();

        var includeProduct      = request.SourceType is null or "product";
        var includeCategory     = request.SourceType is null or "category";
        var includeBrand        = request.SourceType is null or "brand";
        var includeAnnouncement = request.SourceType is null or "announcement";
        var includeUser         = request.SourceType is null or "user";

        // Product images
        if (includeProduct)
        {
            var productImages = await db.ProductImages
                .Include(pi => pi.Product)
                .Where(pi => !pi.Product.IsDeleted)
                .Select(pi => new MediaImageDto(
                    pi.Id,
                    pi.ImageUrl,
                    "product",
                    pi.ProductId,
                    pi.Product.Name,
                    pi.AltText,
                    pi.IsMain,
                    pi.SortOrder,
                    pi.CreatedDate
                ))
                .ToListAsync(cancellationToken);
            all.AddRange(productImages);
        }

        // Category images
        if (includeCategory)
        {
            var catImages = await db.Categories
                .Where(c => !c.IsDeleted && c.ImageUrl != null && c.ImageUrl != "")
                .Select(c => new MediaImageDto(
                    c.Id,
                    c.ImageUrl!,
                    "category",
                    c.Id,
                    c.Name,
                    null,
                    false,
                    0,
                    c.CreatedDate
                ))
                .ToListAsync(cancellationToken);
            all.AddRange(catImages);
        }

        // Brand logos
        if (includeBrand)
        {
            var brandImages = await db.Brands
                .Where(b => !b.IsDeleted && b.LogoUrl != null && b.LogoUrl != "")
                .Select(b => new MediaImageDto(
                    b.Id,
                    b.LogoUrl!,
                    "brand",
                    b.Id,
                    b.Name,
                    null,
                    false,
                    0,
                    b.CreatedDate
                ))
                .ToListAsync(cancellationToken);
            all.AddRange(brandImages);
        }

        // Announcement media
        if (includeAnnouncement)
        {
            var annoImages = await db.Announcements
                .Where(a => !a.IsDeleted && a.MediaUrl != null && a.MediaUrl != ""
                            && (a.MediaType == "image" || a.MediaType == "gif"))
                .Select(a => new MediaImageDto(
                    a.Id,
                    a.MediaUrl!,
                    "announcement",
                    a.Id,
                    a.Title,
                    null,
                    false,
                    0,
                    a.CreatedDate
                ))
                .ToListAsync(cancellationToken);
            all.AddRange(annoImages);
        }

        // User avatars
        if (includeUser)
        {
            var userImages = await db.Users
                .Where(u => !u.IsDeleted && u.AvatarUrl != null && u.AvatarUrl != "")
                .Select(u => new MediaImageDto(
                    u.Id,
                    u.AvatarUrl!,
                    "user",
                    u.Id,
                    u.Name + " " + u.Surname + " (" + u.Email + ")",
                    null,
                    false,
                    0,
                    u.CreatedDate
                ))
                .ToListAsync(cancellationToken);
            all.AddRange(userImages);
        }

        // Apply search
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var q = request.Search.Trim().ToLower();
            all = all.Where(x =>
                x.SourceName.ToLower().Contains(q) ||
                x.Url.ToLower().Contains(q) ||
                (x.AltText != null && x.AltText.ToLower().Contains(q))
            ).ToList();
        }

        // Apply isMain filter
        if (request.IsMain.HasValue)
            all = all.Where(x => x.SourceType != "product" || x.IsMain == request.IsMain.Value).ToList();

        var total = all.Count;
        var items = all
            .OrderByDescending(x => x.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        return PaginatedList<MediaImageDto>.Create(items, total, request.Page, request.PageSize);
    }
}
