using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands;

public record SetMainProductImageCommand(Guid ImageId, Guid ProductId) : IRequest<Result<bool>>;

public class SetMainProductImageHandler(IApplicationDbContext db)
    : IRequestHandler<SetMainProductImageCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(SetMainProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = await db.ProductImages
            .FirstOrDefaultAsync(i => i.Id == request.ImageId && i.ProductId == request.ProductId, cancellationToken);
        if (image is null) return Result<bool>.Failure("Görsel bulunamadı.");

        var existing = await db.ProductImages
            .Where(i => i.ProductId == request.ProductId && i.IsMain)
            .ToListAsync(cancellationToken);
        existing.ForEach(i => i.IsMain = false);

        image.IsMain = true;
        await db.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
