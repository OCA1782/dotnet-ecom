using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;

namespace Ecom.Application.Features.Reviews.Commands;

public record DeleteReviewCommand(Guid Id) : IRequest<Result>;

public class DeleteReviewHandler(IApplicationDbContext db) : IRequestHandler<DeleteReviewCommand, Result>
{
    public async Task<Result> Handle(DeleteReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await db.ProductReviews.FindAsync([request.Id], cancellationToken);
        if (review is null) return Result.Failure("Yorum bulunamadı.");

        review.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
