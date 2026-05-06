using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Cart.Commands;

/// <summary>
/// Kullanıcı giriş yaptıktan sonra misafir sepetini kullanıcı sepetine birleştirir.
/// </summary>
public record MergeGuestCartCommand(string SessionId, Guid UserId) : IRequest<Result>;

public class MergeGuestCartHandler(IApplicationDbContext db) : IRequestHandler<MergeGuestCartCommand, Result>
{
    public async Task<Result> Handle(MergeGuestCartCommand request, CancellationToken cancellationToken)
    {
        var guestCart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.SessionId == request.SessionId && c.UserId == null, cancellationToken);

        if (guestCart is null || !guestCart.Items.Any()) return Result.Success();

        var userCart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken);

        if (userCart is null)
        {
            // Misafir sepeti kullanıcıya ata
            guestCart.UserId = request.UserId;
            guestCart.SessionId = null;
        }
        else
        {
            // Misafir kalemlerini kullanıcı sepetine ekle/güncelle
            foreach (var guestItem in guestCart.Items)
            {
                var existing = userCart.Items.FirstOrDefault(i =>
                    i.ProductId == guestItem.ProductId && i.ProductVariantId == guestItem.ProductVariantId);

                if (existing is not null)
                    existing.Quantity += guestItem.Quantity;
                else
                    userCart.Items.Add(new Domain.Entities.CartItem
                    {
                        CartId = userCart.Id,
                        ProductId = guestItem.ProductId,
                        ProductVariantId = guestItem.ProductVariantId,
                        Quantity = guestItem.Quantity,
                        UnitPrice = guestItem.UnitPrice
                    });
            }

            db.CartItems.RemoveRange(guestCart.Items);
            db.Carts.Remove(guestCart);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
