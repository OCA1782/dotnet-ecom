using Dapper;
using Ecom.Application.Common.Interfaces;
using MediatR;

namespace Ecom.Application.Features.Admin.Queries;

public record GetProductSalesReportQuery(int Days = 30, int TopN = 20) : IRequest<IEnumerable<ProductSalesDto>>;

public record ProductSalesDto(
    Guid ProductId,
    string ProductName,
    string? SKU,
    int TotalQuantity,
    decimal TotalRevenue,
    int OrderCount
);

public class GetProductSalesReportQueryHandler(IDapperQueryService dapper, ICacheService cache)
    : IRequestHandler<GetProductSalesReportQuery, IEnumerable<ProductSalesDto>>
{
    public async Task<IEnumerable<ProductSalesDto>> Handle(GetProductSalesReportQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"report:product-sales:{request.Days}:{request.TopN}";
        var cached = await cache.GetAsync<List<ProductSalesDto>>(cacheKey, cancellationToken);
        if (cached is not null) return cached;

        var since = DateTime.UtcNow.AddDays(-request.Days);
        var param = new DynamicParameters();
        param.Add("Since", since);
        param.Add("TopN", request.TopN);

        var sql = @"
            SELECT TOP (@TopN)
                oi.ProductId,
                p.Name AS ProductName,
                p.SKU,
                SUM(oi.Quantity) AS TotalQuantity,
                SUM(oi.UnitPrice * oi.Quantity) AS TotalRevenue,
                COUNT(DISTINCT o.Id) AS OrderCount
            FROM OrderItems oi
            INNER JOIN Orders o ON o.Id = oi.OrderId
            INNER JOIN Products p ON p.Id = oi.ProductId
            WHERE o.CreatedDate >= @Since
              AND o.Status NOT IN (8, 9)
              AND o.IsDeleted = 0
            GROUP BY oi.ProductId, p.Name, p.SKU
            ORDER BY TotalRevenue DESC";

        var rows = await dapper.QueryAsync<ProductSalesDto>(sql, param, cancellationToken);
        var result = rows.ToList();
        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10), cancellationToken);
        return result;
    }
}
