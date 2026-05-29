using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Queries;

public record GetProductReviewsQuery(Guid ProductId, int Page = 1, int PageSize = 10, Guid? CurrentUserId = null)
    : IRequest<ProductReviewsResult>;

public record ProductReviewsResult(
    double AverageRating,
    int TotalCount,
    int[] RatingDistribution,
    PaginatedList<ReviewDto> Reviews
);

public record ReviewDto(
    Guid Id,
    Guid UserId,
    string UserName,
    int Rating,
    string? Title,
    string Body,
    bool IsVerifiedPurchase,
    DateTime CreatedDate,
    int LikeCount,
    bool IsLikedByUser,
    int DislikeCount,
    bool IsDislikedByUser,
    int ReplyCount,
    int ReportCount
);

public class GetProductReviewsHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductReviewsQuery, ProductReviewsResult>
{
    public async Task<ProductReviewsResult> Handle(GetProductReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = db.ProductReviews
            .Include(r => r.User)
            .Where(r => r.ProductId == request.ProductId && r.IsApproved && !r.IsDeleted);

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

        var reviewIds = await query
            .OrderByDescending(r => r.CreatedDate)
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

        var likedByUser = new HashSet<Guid>();
        var dislikedByUser = new HashSet<Guid>();
        if (request.CurrentUserId.HasValue)
        {
            var userVotes = await db.ReviewLikes
                .Where(l => reviewIds.Contains(l.ReviewId) && l.UserId == request.CurrentUserId.Value && !l.IsDeleted)
                .Select(l => new { l.ReviewId, l.IsLike })
                .ToListAsync(cancellationToken);

            foreach (var v in userVotes)
            {
                if (v.IsLike) likedByUser.Add(v.ReviewId);
                else dislikedByUser.Add(v.ReviewId);
            }
        }

        var replyCounts = await db.ReviewReplies
            .Where(r => reviewIds.Contains(r.ReviewId) && !r.IsDeleted)
            .GroupBy(r => r.ReviewId)
            .Select(g => new { ReviewId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReviewId, x => x.Count, cancellationToken);

        var reportCounts = await db.ReviewReports
            .Where(r => reviewIds.Contains(r.ReviewId) && !r.IsDeleted)
            .GroupBy(r => r.ReviewId)
            .Select(g => new { ReviewId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReviewId, x => x.Count, cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new
            {
                r.Id, r.UserId,
                r.Rating, r.Title, r.Body, r.IsVerifiedPurchase, r.CreatedDate
            })
            .ToListAsync(cancellationToken);

        var itemUserIds = items.Select(r => r.UserId).Distinct().ToList();
        var userNames = await db.Users
            .IgnoreQueryFilters()
            .Where(u => itemUserIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name, u.Surname })
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var dtos = items.Select(r =>
        {
            var u = userNames.GetValueOrDefault(r.UserId);
            var displayName = u is null ? "Kullanıcı"
                : u.Name + " " + (u.Surname.Length > 0 ? u.Surname[..1] + "." : "");
            return new ReviewDto(
            r.Id,
            r.UserId,
            displayName,
            r.Rating,
            r.Title,
            r.Body,
            r.IsVerifiedPurchase,
            r.CreatedDate,
            likeCounts.GetValueOrDefault(r.Id, 0),
            likedByUser.Contains(r.Id),
            dislikeCounts.GetValueOrDefault(r.Id, 0),
            dislikedByUser.Contains(r.Id),
            replyCounts.GetValueOrDefault(r.Id, 0),
            reportCounts.GetValueOrDefault(r.Id, 0)
            );
        }).ToList();

        return new ProductReviewsResult(
            Math.Round(avg, 1),
            total,
            dist,
            PaginatedList<ReviewDto>.Create(dtos, total, request.Page, request.PageSize));
    }
}
