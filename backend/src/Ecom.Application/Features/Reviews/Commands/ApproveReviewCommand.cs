using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;

namespace Ecom.Application.Features.Reviews.Commands;

public record ApproveReviewCommand(Guid Id, bool Approved) : IRequest<Result>;

public class ApproveReviewHandler(IApplicationDbContext db) : IRequestHandler<ApproveReviewCommand, Result>
{
    public async Task<Result> Handle(ApproveReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await db.ProductReviews.FindAsync([request.Id], cancellationToken);
        if (review is null) return Result.Failure("Yorum bulunamadı.");

        review.IsApproved = request.Approved;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
