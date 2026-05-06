using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Queries;

public record GetStocksQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    bool OnlyCritical = false
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
    bool IsCritical
);

public class GetStocksQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStocksQuery, PaginatedList<StockListItemDto>>
{
    public async Task<PaginatedList<StockListItemDto>> Handle(GetStocksQuery request, CancellationToken cancellationToken)
    {
        var query = db.Stocks
            .Include(s => s.Product)
            .Include(s => s.ProductVariant)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(s =>
                (s.Product != null && s.Product.Name.Contains(request.Search)) ||
                (s.Product != null && s.Product.SKU.Contains(request.Search)) ||
                (s.ProductVariant != null && s.ProductVariant.SKU.Contains(request.Search)));

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(s => s.Product != null ? s.Product.Name : s.ProductVariant!.VariantName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new StockListItemDto(
                s.Id,
                s.ProductId,
                s.ProductVariantId,
                s.Product != null ? s.Product.Name : (s.ProductVariant != null ? s.ProductVariant.VariantName : ""),
                s.ProductVariant != null ? s.ProductVariant.VariantName : null,
                s.Product != null ? s.Product.SKU : (s.ProductVariant != null ? s.ProductVariant.SKU : ""),
                s.Quantity,
                s.ReservedQuantity,
                s.Quantity - s.ReservedQuantity,
                s.CriticalStockLevel,
                (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel
            ))
            .ToListAsync(cancellationToken);

        var result = request.OnlyCritical ? items.Where(x => x.IsCritical).ToList() : items;
        return PaginatedList<StockListItemDto>.Create(result, request.OnlyCritical ? result.Count : total, request.Page, request.PageSize);
    }
}
