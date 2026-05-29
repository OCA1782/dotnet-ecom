using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Commands;

public record ToggleReviewLikeCommand(Guid ReviewId, Guid UserId, bool IsLike = true) : IRequest<Result<bool>>;

public class ToggleReviewLikeHandler(IApplicationDbContext db)
    : IRequestHandler<ToggleReviewLikeCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ToggleReviewLikeCommand request, CancellationToken cancellationToken)
    {
        var review = await db.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId && r.IsApproved && !r.IsDeleted, cancellationToken);
        if (review is null)
            return Result<bool>.Failure("Yorum bulunamadı.");

        var existing = await db.ReviewLikes
            .FirstOrDefaultAsync(l => l.ReviewId == request.ReviewId && l.UserId == request.UserId && !l.IsDeleted, cancellationToken);

        bool active;
        if (existing is not null)
        {
            if (existing.IsLike == request.IsLike)
            {
                // Aynı yönde → kaldır (toggle off)
                existing.IsDeleted = true;
                active = false;
            }
            else
            {
                // Zıt yönde → yönü değiştir
                existing.IsLike = request.IsLike;
                active = true;
            }
        }
        else
        {
            db.ReviewLikes.Add(new ReviewLike
            {
                ReviewId = request.ReviewId,
                UserId   = request.UserId,
                IsLike   = request.IsLike,
            });
            active = true;
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(active);
    }
}
