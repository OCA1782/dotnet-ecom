using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Queries;

public record GetAdminReviewsQuery(
    int Page = 1,
    int PageSize = 20,
    bool? IsApproved = null,
    string? Search = null,
    bool? HasReports = null,
    string? SortBy = null
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
    string? RejectionNote,
    DateTime CreatedDate,
    int LikeCount,
    int DislikeCount,
    int ReplyCount,
    int ReportCount,
    bool HasUnresolvedReports,
    string? DataSource = null
);

public class GetAdminReviewsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminReviewsQuery, PaginatedList<AdminReviewDto>>
{
    public async Task<PaginatedList<AdminReviewDto>> Handle(GetAdminReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = db.ProductReviews.AsQueryable();

        if (request.IsApproved.HasValue)
            query = query.Where(r => r.IsApproved == request.IsApproved);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();

            var matchingUserIds = await db.Users
                .IgnoreQueryFilters()
                .Where(u => u.Email.Contains(term) || u.Name.Contains(term) || u.Surname.Contains(term))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var matchingProductIds = await db.Products
                .IgnoreQueryFilters()
                .Where(p => p.Name.Contains(term))
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            query = query.Where(r =>
                r.Body.Contains(term) ||
                r.Title!.Contains(term) ||
                matchingUserIds.Contains(r.UserId) ||
                matchingProductIds.Contains(r.ProductId));
        }

        if (request.HasReports.HasValue && request.HasReports.Value)
        {
            var reportedIds = db.ReviewReports
                .Where(r => !r.IsDeleted && !r.IsResolved)
                .Select(r => r.ReviewId)
                .Distinct();
            query = query.Where(r => reportedIds.Contains(r.Id));
        }

        var total = await query.CountAsync(cancellationToken);

        var orderedQuery = request.SortBy switch
        {
            "rating-asc"       => query.OrderBy(r => r.Rating),
            "rating-desc"      => query.OrderByDescending(r => r.Rating),
            "createdDate-asc"  => query.OrderBy(r => r.CreatedDate),
            "createdDate-desc" => query.OrderByDescending(r => r.CreatedDate),
            "dataSource-asc"   => query.OrderBy(r => r.DataSource),
            "dataSource-desc"  => query.OrderByDescending(r => r.DataSource),
            _                  => query.OrderByDescending(r => r.CreatedDate),
        };

        var reviewIds = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => r.Id)
            .ToListAsync(cancellationToken);

        var likeCounts = await db.ReviewLikes
            .Where(l => reviewIds.Contains(l.ReviewId) && l.IsLike && !l.IsDeleted)
            .GroupBy(l => l.ReviewId)
            .Select(g => new { ReviewId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReviewId, x => x.Count, cancellationToken);

        var dislikeCounts = await db.ReviewLikes
            .Where(l => reviewIds.Contains(l.ReviewId) && !l.IsLike && !l.IsDeleted)
            .GroupBy(l => l.ReviewId)
            .Select(g => new { ReviewId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReviewId, x => x.Count, cancellationToken);

        var replyCounts = await db.ReviewReplies
            .Where(r => reviewIds.Contains(r.ReviewId) && !r.IsDeleted)
            .GroupBy(r => r.ReviewId)
            .Select(g => new { ReviewId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReviewId, x => x.Count, cancellationToken);

        var reportData = await db.ReviewReports
            .Where(r => reviewIds.Contains(r.ReviewId) && !r.IsDeleted)
            .GroupBy(r => r.ReviewId)
            .Select(g => new
            {
                ReviewId = g.Key,
                Total = g.Count(),
                Unresolved = g.Count(r => !r.IsResolved)
            })
            .ToDictionaryAsync(x => x.ReviewId, x => x, cancellationToken);

        var items = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new
            {
                r.Id, r.ProductId, r.UserId,
                r.Rating, r.Title, r.Body, r.IsVerifiedPurchase,
                r.IsApproved, r.RejectionNote, r.CreatedDate, r.DataSource
            })
            .ToListAsync(cancellationToken);

        var productIds = items.Select(r => r.ProductId).Distinct().ToList();
        var userIds2   = items.Select(r => r.UserId).Distinct().ToList();

        var productNames = await db.Products
            .IgnoreQueryFilters()
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name })
            .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);

        var userInfos = await db.Users
            .IgnoreQueryFilters()
            .Where(u => userIds2.Contains(u.Id))
            .Select(u => new { u.Id, u.Name, u.Surname, u.Email })
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var dtos = items.Select(r =>
        {
            var prod = productNames.GetValueOrDefault(r.ProductId, "Ürün");
            var u    = userInfos.GetValueOrDefault(r.UserId);
            return new AdminReviewDto(
            r.Id, r.ProductId, prod,
            u is null ? "Kullanıcı" : $"{u.Name} {u.Surname}",
            u?.Email ?? "",
            r.Rating, r.Title, r.Body, r.IsVerifiedPurchase,
            r.IsApproved, r.RejectionNote, r.CreatedDate,
            likeCounts.GetValueOrDefault(r.Id, 0),
            dislikeCounts.GetValueOrDefault(r.Id, 0),
            replyCounts.GetValueOrDefault(r.Id, 0),
            reportData.ContainsKey(r.Id) ? reportData[r.Id].Total : 0,
            reportData.ContainsKey(r.Id) && reportData[r.Id].Unresolved > 0,
            r.DataSource
            );
        }).ToList();

        return PaginatedList<AdminReviewDto>.Create(dtos, total, request.Page, request.PageSize);
    }
}
