using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Cart.Commands;

public record UpdateCartItemCommand(
    Guid CartItemId,
    Guid? UserId,
    string? SessionId,
    int Quantity
) : IRequest<Result>;

public class UpdateCartItemValidator : AbstractValidator<UpdateCartItemCommand>
{
    public UpdateCartItemValidator()
    {
        RuleFor(x => x.CartItemId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

public class UpdateCartItemHandler(IApplicationDbContext db) : IRequestHandler<UpdateCartItemCommand, Result>
{
    public async Task<Result> Handle(UpdateCartItemCommand request, CancellationToken cancellationToken)
    {
        var item = await db.CartItems
            .Include(i => i.Cart)
            .FirstOrDefaultAsync(i => i.Id == request.CartItemId, cancellationToken);

        if (item is null) return Result.Failure("Sepet kalemi bulunamadı.");

        // Sahiplik kontrolü
        if (request.UserId.HasValue && item.Cart.UserId != request.UserId)
            return Result.Failure("Yetkisiz işlem.");
        if (!request.UserId.HasValue && item.Cart.SessionId != request.SessionId)
            return Result.Failure("Yetkisiz işlem.");

        item.Quantity = request.Quantity;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
