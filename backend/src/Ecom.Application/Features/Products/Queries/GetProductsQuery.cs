using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Queries;

public record GetProductsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    Guid? CategoryId = null,
    string? CategorySlug = null,
    Guid? BrandId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool? InStock = null,
    bool AdminView = false,
    bool? IsFeatured = null,
    bool? OnSale = null,
    string? SortBy = null,       // newest | bestseller | price-asc | price-desc | name-asc | name-desc | stock-asc | stock-desc
    string? BrandIds = null,     // comma-separated brand IDs for multi-brand filter
    int? MinRating = null,       // minimum average rating (1-5)
    string? Attributes = null,   // comma-separated key:value pairs, e.g. "Renk:Kırmızı,Beden:M"
    bool? OnlyActive = null,     // admin view: explicitly restrict to active-only
    string? DataSource = null,   // "__manual__" = null datasource, otherwise exact match
    string? VehicleModel = null, // word-boundary vehicle model search (avoids "Yaris P1" matching "Yaris P10")
    string? OemPartNo = null,    // OEM / part reference number
    string? Chassis = null       // chassis / VIN range
) : IRequest<PaginatedList<ProductListItemDto>>;

public record ProductListItemDto(
    Guid Id,
    string Name,
    string Slug,
    string? ShortDescription,
    string? SKU,
    string? CategoryName,
    string? BrandName,
    decimal Price,
    decimal? DiscountPrice,
    string Currency,
    int AvailableStock,
    string? ImageUrl,
    bool IsActive,
    bool IsPublished,
    bool IsFeatured,
    string? ImportedFromSourceName = null,
    DateTime CreatedDate = default,
    string? DataSource = null,
    string? CreatedByAdminEmail = null
);

public class GetProductsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<GetProductsQuery, PaginatedList<ProductListItemDto>>
{
    public async Task<PaginatedList<ProductListItemDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        // No Include() calls — they force hash joins that require large memory grants in LocalDB.
        // Navigation properties are accessed directly in the final Select() which EF translates
        // to efficient correlated subqueries or nested loop joins on the 5-row result set.
        var query = db.Products
            .AsNoTracking()
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (!request.AdminView)
            query = query.Where(p => p.IsActive && p.IsPublished);
        else if (request.OnlyActive == true)
            query = query.Where(p => p.IsActive);

        if (request.AdminView && !currentUser.IsSuperAdmin && currentUser.UserId.HasValue)
            query = query.Where(p => p.ImportedFromSourceId != null || p.CreatedByAdminId == currentUser.UserId.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search;
            var sp = $"%{s}%";

            // Pre-fetch matching brand IDs — keeps Products filter as single-table predicate so GIN fires.
            var matchingBrandIds = await db.Brands
                .AsNoTracking()
                .Where(b => EF.Functions.ILike(b.Name, sp))
                .Select(b => b.Id)
                .ToListAsync(cancellationToken);

            // Pre-fetch matching category IDs — same pattern, avoids Hash Join.
            var matchingCategoryIds = await db.Categories
                .AsNoTracking()
                .Where(c => !c.IsDeleted && EF.Functions.ILike(c.Name, sp))
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);

            // Pre-fetch admin user IDs by email — covers "Oluşturan" column search.
            var matchingAdminIds = await db.Users
                .AsNoTracking()
                .Where(u => u.Email != null && EF.Functions.ILike(u.Email, sp))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            // Pre-fetch external source IDs by name — covers ImportedFromSourceName column when DataSource is null.
            var matchingSourceIds = await db.ExternalSources
                .AsNoTracking()
                .Where(s => EF.Functions.ILike(s.Name, sp))
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);

            query = query.Where(p =>
                EF.Functions.ILike(p.Name, sp)
                || (p.SKU != null && EF.Functions.ILike(p.SKU, sp))
                || (matchingBrandIds.Count > 0 && p.BrandId.HasValue && matchingBrandIds.Contains(p.BrandId.Value))
                || (matchingCategoryIds.Count > 0 && matchingCategoryIds.Contains(p.CategoryId))
                || (p.DataSource != null && EF.Functions.ILike(p.DataSource, sp))
                || (matchingAdminIds.Count > 0 && p.CreatedByAdminId.HasValue && matchingAdminIds.Contains(p.CreatedByAdminId.Value))
                || (matchingSourceIds.Count > 0 && p.ImportedFromSourceId.HasValue && matchingSourceIds.Contains(p.ImportedFromSourceId.Value)));
        }

        // Vehicle model search — sequential two-tier strategy:
        // Tier 1: VehicleModel indexed column — exact model prefix only.
        //   No base-model fallback: "Yaris P1" must NOT match generic VehicleModel="Yaris" products.
        // Tier 2: Name word-boundary fallback — only runs when Tier 1 returns 0 results.
        if (!string.IsNullOrWhiteSpace(request.VehicleModel))
        {
            var vm = request.VehicleModel.Trim();

            var tier1Query = query.Where(p =>
                p.VehicleModel != null &&
                EF.Functions.ILike(p.VehicleModel, vm + "%"));

            var tier1Count = await tier1Query.CountAsync(cancellationToken);

            if (tier1Count > 0)
            {
                query = tier1Query;
            }
            else
            {
                // Tier 2: Name word-boundary fallback for products not yet tagged with VehicleModel.
                query = query.Where(p =>
                    p.Name == vm ||
                    p.Name.StartsWith(vm + " ") ||
                    p.Name.StartsWith(vm + "/") ||
                    p.Name.StartsWith(vm + "-") ||
                    EF.Functions.ILike(p.Name, $"% {vm} %") ||
                    EF.Functions.ILike(p.Name, $"% {vm}") ||
                    EF.Functions.ILike(p.Name, $"% {vm}/%") ||
                    EF.Functions.ILike(p.Name, $"% {vm}-%") ||
                    EF.Functions.ILike(p.Name, $"% {vm}(%") ||
                    EF.Functions.ILike(p.Name, $"% {vm}|%") ||
                    EF.Functions.ILike(p.Name, $"% {vm},%")
                );
            }
        }

        // OEM search: checks OemPartNumber field (future imports) AND Name (existing data)
        if (!string.IsNullOrWhiteSpace(request.OemPartNo))
        {
            var oemSearch = request.OemPartNo!;
            query = query.Where(p =>
                (p.OemPartNumber != null && p.OemPartNumber.Contains(oemSearch))
                || p.Name.Contains(oemSearch));
        }

        if (!string.IsNullOrWhiteSpace(request.Chassis))
        {
            var chassisSearch = request.Chassis!;
            query = query.Where(p => p.Chassis != null && p.Chassis.Contains(chassisSearch));
        }

        if (request.CategoryId.HasValue)
        {
            // Collect the category itself plus all descendants (BFS) so that
            // clicking a brand-level category (e.g. "Opel") also returns products
            // that live in its sub-categories (e.g. "Astra F", "Corsa D"…).
            var allCatIds = await db.Categories
                .Where(c => !c.IsDeleted)
                .Select(c => new { c.Id, c.ParentCategoryId })
                .ToListAsync(cancellationToken);

            var ids = new HashSet<Guid> { request.CategoryId.Value };
            var queue = new Queue<Guid>();
            queue.Enqueue(request.CategoryId.Value);
            while (queue.Count > 0)
            {
                var pid = queue.Dequeue();
                foreach (var child in allCatIds.Where(c => c.ParentCategoryId == pid).Select(c => c.Id))
                    if (ids.Add(child)) queue.Enqueue(child);
            }

            query = query.Where(p => ids.Contains(p.CategoryId));
        }

        if (!string.IsNullOrWhiteSpace(request.CategorySlug))
        {
            var slug = request.CategorySlug.ToLower();
            query = query.Where(p => p.Category.Slug == slug);
        }

        if (request.BrandId.HasValue)
            query = query.Where(p => p.BrandId == request.BrandId);

        // DataSource filter: "__manual__" = null/empty datasource
        if (!string.IsNullOrWhiteSpace(request.DataSource))
        {
            if (request.DataSource == "__manual__")
                query = query.Where(p => p.DataSource == null || p.DataSource == "");
            else
                query = query.Where(p => p.DataSource == request.DataSource);
        }

        // Multi-brand filter (comma-separated brand IDs)
        if (!string.IsNullOrWhiteSpace(request.BrandIds))
        {
            var ids = request.BrandIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => Guid.TryParse(s.Trim(), out var g) ? g : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();
            if (ids.Count > 0)
                query = query.Where(p => p.BrandId.HasValue && ids.Contains(p.BrandId.Value));
        }

        // Rating filter: require average review score >= minRating
        if (request.MinRating.HasValue && request.MinRating.Value > 0)
        {
            var minRating = request.MinRating.Value;
            var ratedProductIds = await db.ProductReviews
                .Where(r => r.IsApproved)
                .GroupBy(r => r.ProductId)
                .Where(g => g.Average(r => r.Rating) >= minRating)
                .Select(g => g.Key)
                .ToListAsync(cancellationToken);
            query = query.Where(p => ratedProductIds.Contains(p.Id));
        }

        // Attribute/color filter: "Renk:Kırmızı,Beden:M" → products with matching variants
        if (!string.IsNullOrWhiteSpace(request.Attributes))
        {
            var pairs = request.Attributes
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim().Split(':', 2))
                .Where(p => p.Length == 2)
                .Select(p => new { Key = p[0].Trim().ToLower(), Value = p[1].Trim().ToLower() })
                .ToList();

            if (pairs.Count > 0)
            {
                var productIds = await db.ProductVariants
                    .Where(v => v.AttributesJson != "[]" && v.AttributesJson != "")
                    .Select(v => new { v.ProductId, v.AttributesJson })
                    .ToListAsync(cancellationToken);

                var matchingIds = productIds
                    .Where(v =>
                    {
                        try
                        {
                            var attrs = System.Text.Json.JsonSerializer.Deserialize<List<AttrPair>>(v.AttributesJson);
                            if (attrs == null) return false;
                            return pairs.All(filter =>
                                attrs.Any(a =>
                                    a.Key.ToLower() == filter.Key &&
                                    a.Value.ToLower() == filter.Value));
                        }
                        catch { return false; }
                    })
                    .Select(v => v.ProductId)
                    .Distinct()
                    .ToHashSet();

                query = query.Where(p => matchingIds.Contains(p.Id));
            }
        }

        if (request.MinPrice.HasValue)
            query = query.Where(p => (p.DiscountPrice ?? p.Price) >= request.MinPrice);

        if (request.MaxPrice.HasValue)
            query = query.Where(p => (p.DiscountPrice ?? p.Price) <= request.MaxPrice);

        if (request.InStock == true)
            query = query.Where(p => p.Stock != null && (p.Stock.Quantity - p.Stock.ReservedQuantity) > 0);

        if (request.IsFeatured.HasValue)
            query = query.Where(p => p.IsFeatured == request.IsFeatured.Value);

        if (request.OnSale == true)
            query = query.Where(p => p.DiscountPrice != null);

        if (request.SortBy == "newest")
            query = query.Where(p => p.CreatedDate >= DateTime.UtcNow.AddDays(-60));

        var total = await query.CountAsync(cancellationToken);

        IQueryable<Ecom.Domain.Entities.Product> orderedQuery = request.SortBy switch
        {
            "bestseller"  => query
                .GroupJoin(db.OrderItems, p => p.Id, oi => oi.ProductId,
                    (p, ois) => new { Product = p, SalesCount = ois.Sum(oi => (int?)oi.Quantity) ?? 0 })
                .OrderByDescending(x => x.SalesCount)
                .Select(x => x.Product),
            "price-asc"   => query.OrderBy(p => p.DiscountPrice ?? p.Price),
            "price-desc"  => query.OrderByDescending(p => p.DiscountPrice ?? p.Price),
            "name-asc"    => query.OrderBy(p => p.Name),
            "name-desc"   => query.OrderByDescending(p => p.Name),
            "stock-asc"        => query.OrderBy(p => (int?)(p.Stock == null ? 0 : p.Stock.Quantity - p.Stock.ReservedQuantity)),
            "stock-desc"       => query.OrderByDescending(p => (int?)(p.Stock == null ? 0 : p.Stock.Quantity - p.Stock.ReservedQuantity)),
            "createdDate-asc"  => query.OrderBy(p => p.CreatedDate),
            "createdDate-desc" => query.OrderByDescending(p => p.CreatedDate),
            "dataSource-asc"   => query.OrderBy(p => p.DataSource),
            "dataSource-desc"  => query.OrderByDescending(p => p.DataSource),
            // Sort by discount percentage: (Price - DiscountPrice) / Price DESC
            "discount-desc" => query
                .Where(p => p.DiscountPrice != null && p.Price > 0)
                .OrderByDescending(p => (p.Price - p.DiscountPrice!.Value) / p.Price),
            "discount-asc"  => query
                .Where(p => p.DiscountPrice != null && p.Price > 0)
                .OrderBy(p => (p.Price - p.DiscountPrice!.Value) / p.Price),
            _                  => query.OrderByDescending(p => p.CreatedDate),
        };

        var items = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductListItemDto(
                p.Id, p.Name, p.Slug, p.ShortDescription, p.SKU,
                db.Categories.Where(c => c.Id == p.CategoryId).Select(c => c.Name).FirstOrDefault(),
                db.Brands.Where(b => b.Id == p.BrandId).Select(b => b.Name).FirstOrDefault(),
                p.Price, p.DiscountPrice, p.Currency,
                (int?)(db.Stocks.Where(s => s.ProductId == p.Id).Select(s => (int?)(s.Quantity - s.ReservedQuantity)).FirstOrDefault()) ?? 0,
                db.ProductImages.Where(i => i.ProductId == p.Id && i.IsMain).Select(i => i.ImageUrl).FirstOrDefault(),
                p.IsActive, p.IsPublished, p.IsFeatured,
                p.ImportedFromSourceId != null
                    ? db.ExternalSources.Where(s => s.Id == p.ImportedFromSourceId).Select(s => s.Name).FirstOrDefault()
                    : null,
                p.CreatedDate,
                p.DataSource,
                request.AdminView && p.CreatedByAdminId != null
                    ? db.Users.Where(u => u.Id == p.CreatedByAdminId).Select(u => u.Email).FirstOrDefault()
                    : null))
            .ToListAsync(cancellationToken);

        return PaginatedList<ProductListItemDto>.Create(items, total, request.Page, request.PageSize);
    }

    private record AttrPair(string Key, string Value);
}
