using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record MediaImageDto(
    Guid Id,
    string Url,
    string SourceType,   // product | category | brand | announcement | user
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
    bool? IsMain = null,
    bool ExcludeNoImage = false
) : IRequest<PaginatedList<MediaImageDto>>;

public class GetMediaImagesQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetMediaImagesQuery, PaginatedList<MediaImageDto>>
{
    // Max product images returned when "all sources" view is active (prevents OOM with 1M+ records)
    private const int MixedViewProductLimit = 500;

    public async Task<PaginatedList<MediaImageDto>> Handle(GetMediaImagesQuery request, CancellationToken cancellationToken)
    {
        var adminId = (!currentUser.HasEffectiveFullAccess && currentUser.UserId.HasValue) ? currentUser.UserId.Value : (Guid?)null;

        // Product-only view: full DB-level pagination, no memory overhead
        if (request.SourceType == "product")
            return await HandleProductOnly(request, adminId, cancellationToken);

        // Mixed or non-product source views
        var all = new List<MediaImageDto>();

        if (request.SourceType is null or "product")
            all.AddRange(await LoadProductImagesCapped(adminId, cancellationToken));

        if (request.SourceType is null or "category")
            all.AddRange(await LoadCategories(adminId, cancellationToken));

        if (request.SourceType is null or "brand")
            all.AddRange(await LoadBrands(adminId, cancellationToken));

        if (request.SourceType is null or "announcement")
            all.AddRange(await LoadAnnouncements(adminId, cancellationToken));

        if (request.SourceType is null or "user")
            all.AddRange(await LoadUsers(adminId, cancellationToken));

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var q = request.Search.Trim().ToLower();
            all = all.Where(x =>
                x.SourceName.ToLower().Contains(q) ||
                x.Url.ToLower().Contains(q) ||
                (x.AltText != null && x.AltText.ToLower().Contains(q))
            ).ToList();
        }

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

    private async Task<PaginatedList<MediaImageDto>> HandleProductOnly(
        GetMediaImagesQuery request, Guid? adminId, CancellationToken ct)
    {
        const string noImageUrl = "https://images.autoforcepart.com/static/autoforcepart-no-image.png";

        var q = db.ProductImages
            .Where(pi => !pi.IsDeleted && !pi.Product.IsDeleted &&
                         (adminId == null || pi.Product.CreatedByAdminId == adminId));

        if (request.ExcludeNoImage)
            q = q.Where(pi => pi.ImageUrl != noImageUrl);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLower();
            q = q.Where(pi => pi.Product.Name.ToLower().Contains(s) ||
                               pi.ImageUrl.ToLower().Contains(s) ||
                               (pi.AltText != null && pi.AltText.ToLower().Contains(s)));
        }

        if (request.IsMain.HasValue)
            q = q.Where(pi => pi.IsMain == request.IsMain.Value);

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(pi => pi.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(pi => new MediaImageDto(
                pi.Id, pi.ImageUrl, "product", pi.ProductId,
                pi.Product.Name, pi.AltText, pi.IsMain, pi.SortOrder, pi.CreatedDate))
            .ToListAsync(ct);

        return PaginatedList<MediaImageDto>.Create(items, total, request.Page, request.PageSize);
    }

    // In mixed-source view, cap product images to avoid loading millions of records
    private Task<List<MediaImageDto>> LoadProductImagesCapped(
        Guid? adminId, CancellationToken ct)
    {
        return db.ProductImages
            .Where(pi => !pi.IsDeleted && pi.IsMain && !pi.Product.IsDeleted &&
                         (adminId == null || pi.Product.CreatedByAdminId == adminId))
            .OrderByDescending(pi => pi.CreatedDate)
            .Take(MixedViewProductLimit)
            .Select(pi => new MediaImageDto(
                pi.Id, pi.ImageUrl, "product", pi.ProductId,
                pi.Product.Name, pi.AltText, pi.IsMain, pi.SortOrder, pi.CreatedDate))
            .ToListAsync(ct);
    }

    private Task<List<MediaImageDto>> LoadCategories(Guid? adminId, CancellationToken ct) =>
        db.Categories
            .Where(c => !c.IsDeleted && c.ImageUrl != null && c.ImageUrl != "" &&
                        (adminId == null || c.CreatedByAdminId == adminId))
            .Select(c => new MediaImageDto(c.Id, c.ImageUrl!, "category", c.Id, c.Name, null, false, 0, c.CreatedDate))
            .ToListAsync(ct);

    private Task<List<MediaImageDto>> LoadBrands(Guid? adminId, CancellationToken ct) =>
        db.Brands
            .Where(b => !b.IsDeleted && b.LogoUrl != null && b.LogoUrl != "" &&
                        (adminId == null || b.CreatedByAdminId == adminId))
            .Select(b => new MediaImageDto(b.Id, b.LogoUrl!, "brand", b.Id, b.Name, null, false, 0, b.CreatedDate))
            .ToListAsync(ct);

    private Task<List<MediaImageDto>> LoadAnnouncements(Guid? adminId, CancellationToken ct) =>
        db.Announcements
            .Where(a => !a.IsDeleted && a.MediaUrl != null && a.MediaUrl != "" &&
                        (a.MediaType == "image" || a.MediaType == "gif") &&
                        (adminId == null || a.CreatedByAdminId == adminId))
            .Select(a => new MediaImageDto(a.Id, a.MediaUrl!, "announcement", a.Id, a.Title, null, false, 0, a.CreatedDate))
            .ToListAsync(ct);

    private Task<List<MediaImageDto>> LoadUsers(Guid? adminId, CancellationToken ct) =>
        db.Users
            .Where(u => !u.IsDeleted && u.AvatarUrl != null && u.AvatarUrl != "" &&
                        (adminId == null || u.CreatedByAdminId == adminId || u.Id == adminId))
            .Select(u => new MediaImageDto(
                u.Id, u.AvatarUrl!, "user", u.Id,
                u.Name + " " + u.Surname + " (" + u.Email + ")", null, false, 0, u.CreatedDate))
            .ToListAsync(ct);
}
