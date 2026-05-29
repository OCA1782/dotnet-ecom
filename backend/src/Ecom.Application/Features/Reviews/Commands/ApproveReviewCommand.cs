using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Commands;

public record ApproveReviewCommand(Guid Id, bool Approved, string? RejectionNote = null, bool NotifyUser = false) : IRequest<Result>;

public class ApproveReviewHandler(IApplicationDbContext db, IEmailService emailService, IAuditService auditService) : IRequestHandler<ApproveReviewCommand, Result>
{
    public async Task<Result> Handle(ApproveReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await db.ProductReviews
            .Include(r => r.User)
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

        if (review is null) return Result.Failure("Yorum bulunamadı.");

        var oldStatus = review.IsApproved ? "Onaylı" : "Beklemede";
        review.IsApproved = request.Approved;
        if (!request.Approved)
            review.RejectionNote = request.RejectionNote;
        else
            review.RejectionNote = null;

        var newValue = request.Approved
            ? "Onaylı"
            : $"Reddedildi — {(string.IsNullOrWhiteSpace(request.RejectionNote) ? "Sebep belirtilmedi" : request.RejectionNote)}";

        await db.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            request.Approved ? "Onaylandı" : "Reddedildi",
            "Yorum",
            review.Id.ToString(),
            oldValue: oldStatus,
            newValue: newValue,
            cancellationToken: cancellationToken);

        if (!request.Approved && request.NotifyUser && review.User is not null)
        {
            try
            {
                await emailService.SendReviewRejectionAsync(
                    review.User.Email,
                    $"{review.User.Name} {review.User.Surname}",
                    review.Product?.Name ?? "Ürün",
                    request.RejectionNote,
                    cancellationToken);
            }
            catch { /* e-posta hatası işlemi engellemez */ }
        }

        return Result.Success();
    }
}
