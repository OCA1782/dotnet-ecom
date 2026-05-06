using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Brands.Commands;

public record CreateBrandCommand(
    string Name,
    string Slug,
    string? LogoUrl,
    string? Description,
    string? MetaTitle,
    string? MetaDescription
) : IRequest<Result<Guid>>;

public class CreateBrandValidator : AbstractValidator<CreateBrandCommand>
{
    public CreateBrandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug sadece küçük harf, rakam ve tire içerebilir.");
    }
}

public class CreateBrandHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<CreateBrandCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateBrandCommand request, CancellationToken cancellationToken)
    {
        var slugExists = await db.Brands.AnyAsync(b => b.Slug == request.Slug, cancellationToken);
        if (slugExists)
            return Result<Guid>.Failure("Bu slug zaten kullanılıyor.");

        var brand = new Brand
        {
            Name = request.Name,
            Slug = request.Slug,
            LogoUrl = request.LogoUrl,
            Description = request.Description,
            MetaTitle = request.MetaTitle,
            MetaDescription = request.MetaDescription
        };

        db.Brands.Add(brand);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("BrandCreated", "Brand", brand.Id.ToString(), cancellationToken: cancellationToken);

        return Result<Guid>.Success(brand.Id);
    }
}
