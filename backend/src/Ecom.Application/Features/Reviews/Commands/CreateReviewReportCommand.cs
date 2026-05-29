using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Commands;

public record CreateReviewReportCommand(Guid ReviewId, Guid UserId, string Reason) : IRequest<Result>;

public class CreateReviewReportHandler(IApplicationDbContext db)
    : IRequestHandler<CreateReviewReportCommand, Result>
{
    public async Task<Result> Handle(CreateReviewReportCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            return Result.Failure("Şikayet nedeni zorunludur.");

        var review = await db.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId && r.IsApproved && !r.IsDeleted, cancellationToken);
        if (review is null)
            return Result.Failure("Yorum bulunamadı.");

        var alreadyReported = await db.ReviewReports
            .AnyAsync(rr => rr.ReviewId == request.ReviewId && rr.UserId == request.UserId && !rr.IsDeleted, cancellationToken);
        if (alreadyReported)
            return Result.Failure("Bu yorumu zaten şikayet ettiniz.");

        db.ReviewReports.Add(new ReviewReport
        {
            ReviewId = request.ReviewId,
            UserId   = request.UserId,
            Reason   = request.Reason.Trim(),
        });

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
