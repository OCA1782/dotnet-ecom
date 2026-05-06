using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Brands.Commands;

public record UpdateBrandCommand(
    Guid Id, string Name, string Slug,
    string? LogoUrl, string? Description,
    bool IsActive, string? MetaTitle, string? MetaDescription
) : IRequest<Result>;

public class UpdateBrandValidator : AbstractValidator<UpdateBrandCommand>
{
    public UpdateBrandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug sadece küçük harf, rakam ve tire içerebilir.");
    }
}

public class UpdateBrandHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<UpdateBrandCommand, Result>
{
    public async Task<Result> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await db.Brands.FindAsync([request.Id], cancellationToken);
        if (brand is null) return Result.Failure("Marka bulunamadı.");

        var slugExists = await db.Brands.AnyAsync(b => b.Slug == request.Slug && b.Id != request.Id, cancellationToken);
        if (slugExists) return Result.Failure("Bu slug başka bir markada kullanılıyor.");

        var old = brand.Name;
        brand.Name = request.Name;
        brand.Slug = request.Slug;
        brand.LogoUrl = request.LogoUrl;
        brand.Description = request.Description;
        brand.IsActive = request.IsActive;
        brand.MetaTitle = request.MetaTitle;
        brand.MetaDescription = request.MetaDescription;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("BrandUpdated", "Brand", brand.Id.ToString(), old, brand.Name, cancellationToken: cancellationToken);

        return Result.Success();
    }
}
