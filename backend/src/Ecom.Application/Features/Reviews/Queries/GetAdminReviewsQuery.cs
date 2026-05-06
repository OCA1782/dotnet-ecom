using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Queries;

public record GetAdminReviewsQuery(
    int Page = 1,
    int PageSize = 20,
    bool? IsApproved = null,
    string? Search = null
) : IRequest<PaginatedList<AdminReviewDto>>;

public record AdminReviewDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string UserName,
    string UserEmail,
    int Rating,
    string? Title,
    string Body,
    bool IsVerifiedPurchase,
    bool IsApproved,
    DateTime CreatedDate
);

public class GetAdminReviewsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminReviewsQuery, PaginatedList<AdminReviewDto>>
{
    public async Task<PaginatedList<AdminReviewDto>> Handle(GetAdminReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = db.ProductReviews
            .Include(r => r.Product)
            .Include(r => r.User)
            .AsQueryable();

        if (request.IsApproved.HasValue)
            query = query.Where(r => r.IsApproved == request.IsApproved);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(r =>
                r.Product.Name.Contains(request.Search) ||
                r.Body.Contains(request.Search) ||
                r.User.Email.Contains(request.Search));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new AdminReviewDto(
                r.Id,
                r.ProductId,
                r.Product.Name,
                r.User.Name + " " + r.User.Surname,
                r.User.Email,
                r.Rating,
                r.Title,
                r.Body,
                r.IsVerifiedPurchase,
                r.IsApproved,
                r.CreatedDate))
            .ToListAsync(cancellationToken);

        return PaginatedList<AdminReviewDto>.Create(items, total, request.Page, request.PageSize);
    }
}
