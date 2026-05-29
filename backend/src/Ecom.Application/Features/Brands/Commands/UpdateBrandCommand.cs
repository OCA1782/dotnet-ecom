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

        var changes = new List<string>();
        if (brand.Name != request.Name) changes.Add($"Ad: {brand.Name} → {request.Name}");
        if (brand.Slug != request.Slug) changes.Add($"Slug: {brand.Slug} → {request.Slug}");
        if (brand.IsActive != request.IsActive) changes.Add($"Durum: {(brand.IsActive ? "Aktif" : "Pasif")} → {(request.IsActive ? "Aktif" : "Pasif")}");

        brand.Name = request.Name;
        brand.Slug = request.Slug;
        brand.LogoUrl = request.LogoUrl;
        brand.Description = request.Description;
        brand.IsActive = request.IsActive;
        brand.MetaTitle = request.MetaTitle;
        brand.MetaDescription = request.MetaDescription;

        await db.SaveChangesAsync(cancellationToken);
        var detail = changes.Count > 0 ? string.Join(" | ", changes) : null;
        await audit.LogAsync("BrandUpdated", "Marka", brand.Id.ToString(), null, detail, cancellationToken: cancellationToken);

        return Result.Success();
    }
}
