using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Queries;

public record GetProductReviewsQuery(Guid ProductId, int Page = 1, int PageSize = 10)
    : IRequest<ProductReviewsResult>;

public record ProductReviewsResult(
    double AverageRating,
    int TotalCount,
    int[] RatingDistribution, // index 0=1★ count ... index 4=5★ count
    PaginatedList<ReviewDto> Reviews
);

public record ReviewDto(
    Guid Id,
    string UserName,
    int Rating,
    string? Title,
    string Body,
    bool IsVerifiedPurchase,
    DateTime CreatedDate
);

public class GetProductReviewsHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductReviewsQuery, ProductReviewsResult>
{
    public async Task<ProductReviewsResult> Handle(GetProductReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = db.ProductReviews
            .Include(r => r.User)
            .Where(r => r.ProductId == request.ProductId && r.IsApproved);

        var total = await query.CountAsync(cancellationToken);

        var distribution = await query
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var dist = new int[5];
        foreach (var d in distribution)
            if (d.Rating >= 1 && d.Rating <= 5)
                dist[d.Rating - 1] = d.Count;

        var avg = total == 0 ? 0 : dist.Select((c, i) => c * (i + 1)).Sum() / (double)total;

        var items = await query
            .OrderByDescending(r => r.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new ReviewDto(
                r.Id,
                r.User.Name + " " + r.User.Surname.Substring(0, 1) + ".",
                r.Rating,
                r.Title,
                r.Body,
                r.IsVerifiedPurchase,
                r.CreatedDate))
            .ToListAsync(cancellationToken);

        return new ProductReviewsResult(
            Math.Round(avg, 1),
            total,
            dist,
            PaginatedList<ReviewDto>.Create(items, total, request.Page, request.PageSize));
    }
}
