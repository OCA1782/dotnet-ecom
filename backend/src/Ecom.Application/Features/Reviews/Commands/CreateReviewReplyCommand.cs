using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Commands;

public class CreateReviewReplyCommand : IRequest<Result<Guid>>
{
    public Guid ReviewId { get; set; }
    public Guid UserId { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class CreateReviewReplyHandler(IApplicationDbContext db)
    : IRequestHandler<CreateReviewReplyCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateReviewReplyCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Body) || request.Body.Length > 1000)
            return Result<Guid>.Failure("Yanıt 1–1000 karakter arasında olmalıdır.");

        var review = await db.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId && r.IsApproved && !r.IsDeleted, cancellationToken);
        if (review is null)
            return Result<Guid>.Failure("Yorum bulunamadı.");

        var reply = new ReviewReply
        {
            ReviewId = request.ReviewId,
            UserId   = request.UserId,
            Body     = request.Body.Trim(),
        };

        db.ReviewReplies.Add(reply);
        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(reply.Id);
    }
}
