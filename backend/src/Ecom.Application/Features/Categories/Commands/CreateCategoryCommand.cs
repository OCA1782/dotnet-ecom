using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Categories.Commands;

public record CreateCategoryCommand(
    string Name,
    string Slug,
    Guid? ParentCategoryId,
    string? Description,
    string? ImageUrl,
    int SortOrder,
    bool ShowInMenu,
    string? MetaTitle,
    string? MetaDescription
) : IRequest<Result<Guid>>;

public class CreateCategoryValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug sadece küçük harf, rakam ve tire içerebilir.");
    }
}

public class CreateCategoryHandler(IApplicationDbContext db, IAuditService audit, ICurrentUserService currentUser)
    : IRequestHandler<CreateCategoryCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var slugExists = await db.Categories.AnyAsync(c => c.Slug == request.Slug, cancellationToken);
        if (slugExists)
            return Result<Guid>.Failure("Bu slug zaten kullanılıyor.");

        if (request.ParentCategoryId.HasValue)
        {
            var parentExists = await db.Categories.AnyAsync(c => c.Id == request.ParentCategoryId, cancellationToken);
            if (!parentExists)
                return Result<Guid>.Failure("Üst kategori bulunamadı.");
        }

        var category = new Category
        {
            Name = request.Name,
            Slug = request.Slug,
            ParentCategoryId = request.ParentCategoryId,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            SortOrder = request.SortOrder,
            ShowInMenu = request.ShowInMenu,
            MetaTitle = request.MetaTitle,
            MetaDescription = request.MetaDescription
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CategoryCreated", "Category", category.Id.ToString(), cancellationToken: cancellationToken);

        return Result<Guid>.Success(category.Id);
    }
}
