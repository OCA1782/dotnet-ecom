using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Queries;

public record GetStocksQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    bool OnlyCritical = false,
    string? SortBy = null
) : IRequest<PaginatedList<StockListItemDto>>;

public record StockListItemDto(
    Guid StockId,
    Guid? ProductId,
    Guid? VariantId,
    string ProductName,
    string? VariantName,
    string SKU,
    int Quantity,
    int ReservedQuantity,
    int AvailableQuantity,
    int CriticalStockLevel,
    bool IsCritical,
    DateTime CreatedDate = default,
    string? DataSource = null
);

public class GetStocksQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetStocksQuery, PaginatedList<StockListItemDto>>
{
    public async Task<PaginatedList<StockListItemDto>> Handle(GetStocksQuery request, CancellationToken cancellationToken)
    {
        var query = db.Stocks
            .IgnoreQueryFilters()
            .Where(s => !s.IsDeleted)
            .Include(s => s.Product)
            .Include(s => s.ProductVariant)
            .AsQueryable();

        if (!currentUser.IsSuperAdmin && currentUser.UserId.HasValue)
            query = query.Where(s => s.Product != null && s.Product.CreatedByAdminId == currentUser.UserId.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(s =>
                (s.Product != null && s.Product.Name.Contains(request.Search)) ||
                (s.Product != null && s.Product.SKU != null && s.Product.SKU.Contains(request.Search)) ||
                (s.ProductVariant != null && s.ProductVariant.SKU.Contains(request.Search)));

        if (request.OnlyCritical)
            query = query.Where(s => (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel);

        var total = await query.CountAsync(cancellationToken);

        var orderedQuery = request.SortBy switch
        {
            "name-asc"         => query.OrderBy(s => s.Product != null ? s.Product.Name : s.ProductVariant!.VariantName),
            "name-desc"        => query.OrderByDescending(s => s.Product != null ? s.Product.Name : s.ProductVariant!.VariantName),
            "quantity-asc"     => query.OrderBy(s => s.Quantity - s.ReservedQuantity),
            "quantity-desc"    => query.OrderByDescending(s => s.Quantity - s.ReservedQuantity),
            "createdDate-asc"  => query.OrderBy(s => s.CreatedDate),
            "createdDate-desc" => query.OrderByDescending(s => s.CreatedDate),
            "dataSource-asc"   => query.OrderBy(s => s.DataSource),
            "dataSource-desc"  => query.OrderByDescending(s => s.DataSource),
            _                  => query.OrderBy(s => s.Product != null ? s.Product.Name : s.ProductVariant!.VariantName),
        };

        var items = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new StockListItemDto(
                s.Id,
                s.ProductId,
                s.ProductVariantId,
                s.Product != null ? s.Product.Name
                    : (s.ProductVariant != null ? s.ProductVariant.VariantName
                    : (s.ProductId != null ? "[Silinmiş Ürün]" : "[Bilinmeyen]")),
                s.ProductVariant != null ? s.ProductVariant.VariantName : null,
                s.Product != null ? (s.Product.SKU ?? "")
                    : (s.ProductVariant != null ? s.ProductVariant.SKU : ""),
                s.Quantity,
                s.ReservedQuantity,
                s.Quantity - s.ReservedQuantity,
                s.CriticalStockLevel,
                (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel,
                s.CreatedDate,
                s.DataSource
            ))
            .ToListAsync(cancellationToken);

        return PaginatedList<StockListItemDto>.Create(items, total, request.Page, request.PageSize);
    }
}
