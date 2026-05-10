using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Commands;

public class UpdateReviewCommand : IRequest<Result>
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class UpdateReviewValidator : AbstractValidator<UpdateReviewCommand>
{
    public UpdateReviewValidator()
    {
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Title).MaximumLength(150);
    }
}

public class UpdateReviewHandler(IApplicationDbContext db) : IRequestHandler<UpdateReviewCommand, Result>
{
    public async Task<Result> Handle(UpdateReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await db.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);
        if (review is null)
            return Result.Failure("Yorum bulunamadı.");
        if (review.UserId != request.UserId)
            return Result.Failure("Bu yorumu düzenleme yetkiniz yok.");

        review.Rating = request.Rating;
        review.Title = request.Title;
        review.Body = request.Body;
        review.IsApproved = false;

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
