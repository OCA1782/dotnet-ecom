using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Commands;

public record DeleteReviewCommand(Guid Id) : IRequest<Result>;

public class DeleteReviewHandler(IApplicationDbContext db, IAuditService auditService) : IRequestHandler<DeleteReviewCommand, Result>
{
    public async Task<Result> Handle(DeleteReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await db.ProductReviews
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

        if (review is null) return Result.Failure("Yorum bulunamadı.");

        var detail = $"{review.Product?.Name ?? "Ürün"} — Puan: {review.Rating}★";
        review.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            "Silindi", "Yorum", review.Id.ToString(),
            oldValue: detail,
            cancellationToken: cancellationToken);

        return Result.Success();
    }
}
