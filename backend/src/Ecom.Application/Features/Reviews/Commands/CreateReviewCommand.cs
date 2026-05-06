using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Commands;

public class CreateReviewCommand : IRequest<Result<Guid>>
{
    public Guid ProductId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class CreateReviewValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewValidator()
    {
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Title).MaximumLength(150);
    }
}

public class CreateReviewHandler(IApplicationDbContext db) : IRequestHandler<CreateReviewCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);
        if (product is null)
            return Result<Guid>.Failure("Ürün bulunamadı.");

        var alreadyReviewed = await db.ProductReviews
            .AnyAsync(r => r.ProductId == request.ProductId && r.UserId == request.UserId, cancellationToken);
        if (alreadyReviewed)
            return Result<Guid>.Failure("Bu ürün için zaten bir yorum yazdınız.");

        // Check verified purchase
        var isVerified = await db.OrderItems
            .AnyAsync(oi =>
                oi.ProductId == request.ProductId &&
                oi.Order!.UserId == request.UserId &&
                (int)oi.Order.Status >= 6, // Delivered or Completed
                cancellationToken);

        var review = new ProductReview
        {
            ProductId = request.ProductId,
            UserId = request.UserId,
            Rating = request.Rating,
            Title = request.Title,
            Body = request.Body,
            IsVerifiedPurchase = isVerified,
            IsApproved = false
        };

        db.ProductReviews.Add(review);
        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(review.Id);
    }
}
