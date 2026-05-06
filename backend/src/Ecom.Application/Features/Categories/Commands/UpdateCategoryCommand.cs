using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Categories.Commands;

public record UpdateCategoryCommand(
    Guid Id,
    string Name,
    string Slug,
    Guid? ParentCategoryId,
    string? Description,
    string? ImageUrl,
    int SortOrder,
    bool IsActive,
    bool ShowInMenu,
    string? MetaTitle,
    string? MetaDescription
) : IRequest<Result>;

public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug sadece küçük harf, rakam ve tire içerebilir.");
    }
}

public class UpdateCategoryHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<UpdateCategoryCommand, Result>
{
    public async Task<Result> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await db.Categories.FindAsync([request.Id], cancellationToken);
        if (category is null)
            return Result.Failure("Kategori bulunamadı.");

        var slugExists = await db.Categories.AnyAsync(
            c => c.Slug == request.Slug && c.Id != request.Id, cancellationToken);
        if (slugExists)
            return Result.Failure("Bu slug başka bir kategoride kullanılıyor.");

        if (request.ParentCategoryId == request.Id)
            return Result.Failure("Kategori kendisinin üst kategorisi olamaz.");

        var old = $"{category.Name}|{category.IsActive}";
        category.Name = request.Name;
        category.Slug = request.Slug;
        category.ParentCategoryId = request.ParentCategoryId;
        category.Description = request.Description;
        category.ImageUrl = request.ImageUrl;
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
        category.ShowInMenu = request.ShowInMenu;
        category.MetaTitle = request.MetaTitle;
        category.MetaDescription = request.MetaDescription;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CategoryUpdated", "Category", category.Id.ToString(), old, category.Name, cancellationToken: cancellationToken);

        return Result.Success();
    }
}
