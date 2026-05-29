using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Queries;

public record GetAllStockMovementsQuery(
    int Page = 1,
    int PageSize = 30,
    string? MovementType = null,
    Guid? ProductId = null
) : IRequest<PaginatedList<AllStockMovementDto>>;

public record AllStockMovementDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string Sku,
    string MovementType,
    int Quantity,
    int QuantityBefore,
    int QuantityAfter,
    Guid? OrderId,
    string? Note,
    DateTime CreatedDate
);

public class GetAllStockMovementsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAllStockMovementsQuery, PaginatedList<AllStockMovementDto>>
{
    public async Task<PaginatedList<AllStockMovementDto>> Handle(GetAllStockMovementsQuery request, CancellationToken cancellationToken)
    {
        var query = db.StockMovements
            .Join(db.Stocks, m => m.StockId, s => s.Id, (m, s) => new { m, s })
            .Where(x => x.s.ProductId != null);

        if (request.MovementType is not null && Enum.TryParse<StockMovementType>(request.MovementType, out var mt))
            query = query.Where(x => x.m.MovementType == mt);

        if (request.ProductId.HasValue)
            query = query.Where(x => x.s.ProductId == request.ProductId.Value);

        var total = await query.CountAsync(cancellationToken);

        var productIds = await query
            .Select(x => x.s.ProductId!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        var products = await db.Products
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name, p.SKU })
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var items = await query
            .OrderByDescending(x => x.m.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new
            {
                x.m.Id,
                ProductId = x.s.ProductId!.Value,
                x.m.MovementType,
                x.m.Quantity,
                x.m.QuantityBefore,
                x.m.QuantityAfter,
                x.m.OrderId,
                x.m.Note,
                x.m.CreatedDate,
            })
            .ToListAsync(cancellationToken);

        var dtos = items.Select(x =>
        {
            var p = products.GetValueOrDefault(x.ProductId);
            return new AllStockMovementDto(
                x.Id,
                x.ProductId,
                p?.Name ?? "Ürün",
                p?.SKU ?? "-",
                x.MovementType.ToString(),
                x.Quantity,
                x.QuantityBefore,
                x.QuantityAfter,
                x.OrderId,
                x.Note,
                x.CreatedDate);
        }).ToList();

        return PaginatedList<AllStockMovementDto>.Create(dtos, total, request.Page, request.PageSize);
    }
}
