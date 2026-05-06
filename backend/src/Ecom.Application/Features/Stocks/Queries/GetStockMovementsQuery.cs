using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Queries;

public record GetStockMovementsQuery(
    Guid ProductId,
    Guid? VariantId = null,
    int Page = 1,
    int PageSize = 30
) : IRequest<PaginatedList<StockMovementDto>>;

public record StockMovementDto(
    Guid Id,
    string MovementType,
    int Quantity,
    int QuantityBefore,
    int QuantityAfter,
    Guid? OrderId,
    string? Note,
    DateTime CreatedDate
);

public class GetStockMovementsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStockMovementsQuery, PaginatedList<StockMovementDto>>
{
    public async Task<PaginatedList<StockMovementDto>> Handle(GetStockMovementsQuery request, CancellationToken cancellationToken)
    {
        var stock = await db.Stocks
            .FirstOrDefaultAsync(s =>
                (request.VariantId.HasValue ? s.ProductVariantId == request.VariantId : s.ProductId == request.ProductId && s.ProductVariantId == null),
                cancellationToken);

        if (stock is null)
            return PaginatedList<StockMovementDto>.Create([], 0, 1, request.PageSize);

        var query = db.StockMovements
            .Where(m => m.StockId == stock.Id)
            .OrderByDescending(m => m.CreatedDate);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(m => new StockMovementDto(
                m.Id, m.MovementType.ToString(),
                m.Quantity, m.QuantityBefore, m.QuantityAfter,
                m.OrderId, m.Note, m.CreatedDate))
            .ToListAsync(cancellationToken);

        return PaginatedList<StockMovementDto>.Create(items, total, request.Page, request.PageSize);
    }
}
