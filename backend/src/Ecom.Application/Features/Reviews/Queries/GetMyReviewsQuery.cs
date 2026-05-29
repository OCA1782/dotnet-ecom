using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Queries;

public record MyReviewDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    int Rating,
    string? Title,
    string Body,
    bool IsApproved,
    bool IsVerifiedPurchase,
    DateTime CreatedDate
);

public record GetMyReviewsQuery(Guid UserId, int Page = 1, int PageSize = 10)
    : IRequest<PaginatedList<MyReviewDto>>;

public class GetMyReviewsHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyReviewsQuery, PaginatedList<MyReviewDto>>
{
    public async Task<PaginatedList<MyReviewDto>> Handle(GetMyReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = db.ProductReviews
            .Include(r => r.Product)
            .Where(r => r.UserId == request.UserId)
            .OrderByDescending(r => r.CreatedDate);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new MyReviewDto(
                r.Id,
                r.ProductId,
                r.Product.Name,
                r.Product.Slug,
                r.Rating,
                r.Title,
                r.Body,
                r.IsApproved,
                r.IsVerifiedPurchase,
                r.CreatedDate))
            .ToListAsync(cancellationToken);

        return PaginatedList<MyReviewDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
