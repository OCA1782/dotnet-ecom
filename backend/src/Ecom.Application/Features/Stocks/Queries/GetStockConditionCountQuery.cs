using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Queries;

public record GetStockConditionCountQuery(int? MinStock, int? MaxStock) : IRequest<int>;

public class GetStockConditionCountHandler(IApplicationDbContext db)
    : IRequestHandler<GetStockConditionCountQuery, int>
{
    public async Task<int> Handle(GetStockConditionCountQuery request, CancellationToken cancellationToken)
    {
        var query = db.Stocks.AsQueryable();

        if (request.MinStock.HasValue)
            query = query.Where(s => (s.Quantity - s.ReservedQuantity) >= request.MinStock.Value);

        if (request.MaxStock.HasValue)
            query = query.Where(s => (s.Quantity - s.ReservedQuantity) <= request.MaxStock.Value);

        return await query.Where(s => s.ProductId != null).CountAsync(cancellationToken);
    }
}
