using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Campaigns;

public record CampaignDto(
    Guid Id, string Title, string? Subtitle, string Icon,
    string ColorScheme, string? ImageUrl, string? StylesJson,
    string? LinkUrl, string? LinkText,
    int DisplayOrder, bool IsActive, DateTime CreatedDate,
    string? CreatedByAdminEmail = null
);

public record GetCampaignsQuery(bool OnlyActive = true) : IRequest<List<CampaignDto>>;

public class GetCampaignsHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<GetCampaignsQuery, List<CampaignDto>>
{
    public async Task<List<CampaignDto>> Handle(GetCampaignsQuery request, CancellationToken cancellationToken)
    {
        var q = db.Campaigns.Where(c => !c.IsDeleted);
        if (request.OnlyActive) q = q.Where(c => c.IsActive);
        if (!currentUser.IsSuperAdmin && currentUser.UserId.HasValue)
            q = q.Where(c => c.CreatedByAdminId == currentUser.UserId.Value);
        return await q.OrderBy(c => c.DisplayOrder).ThenBy(c => c.CreatedDate)
            .Select(c => new CampaignDto(c.Id, c.Title, c.Subtitle, c.Icon, c.ColorScheme, c.ImageUrl, c.StylesJson, c.LinkUrl, c.LinkText, c.DisplayOrder, c.IsActive, c.CreatedDate,
                c.CreatedByAdminId != null ? db.Users.Where(u => u.Id == c.CreatedByAdminId).Select(u => u.Email).FirstOrDefault() : null))
            .ToListAsync(cancellationToken);
    }
}

public record CreateCampaignCommand(string Title, string? Subtitle, string Icon, string ColorScheme, string? ImageUrl, string? StylesJson, string? LinkUrl, string? LinkText, int DisplayOrder, bool IsActive) : IRequest<Result<CampaignDto>>;

public class CreateCampaignValidator : AbstractValidator<CreateCampaignCommand>
{
    public CreateCampaignValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ColorScheme).NotEmpty().Must(s => new[] { "orange","teal","navy","amber","purple","green","rose","sky" }.Contains(s))
            .WithMessage("Geçerli bir renk seçin.");
    }
}

public class CreateCampaignHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<CreateCampaignCommand, Result<CampaignDto>>
{
    public async Task<Result<CampaignDto>> Handle(CreateCampaignCommand request, CancellationToken cancellationToken)
    {
        var c = new Domain.Entities.Campaign
        {
            Title = request.Title, Subtitle = request.Subtitle, Icon = request.Icon,
            ColorScheme = request.ColorScheme, ImageUrl = request.ImageUrl, StylesJson = request.StylesJson,
            LinkUrl = request.LinkUrl, LinkText = request.LinkText,
            DisplayOrder = request.DisplayOrder, IsActive = request.IsActive,
            CreatedByAdminId = currentUser.IsSuperAdmin ? null : currentUser.UserId,
        };
        db.Campaigns.Add(c);
        await db.SaveChangesAsync(cancellationToken);
        return Result<CampaignDto>.Success(new CampaignDto(c.Id, c.Title, c.Subtitle, c.Icon, c.ColorScheme, c.ImageUrl, c.StylesJson, c.LinkUrl, c.LinkText, c.DisplayOrder, c.IsActive, c.CreatedDate));
    }
}

public record UpdateCampaignCommand(Guid Id, string Title, string? Subtitle, string Icon, string ColorScheme, string? ImageUrl, string? StylesJson, string? LinkUrl, string? LinkText, int DisplayOrder, bool IsActive) : IRequest<Result<bool>>;

public class UpdateCampaignHandler(IApplicationDbContext db) : IRequestHandler<UpdateCampaignCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateCampaignCommand request, CancellationToken cancellationToken)
    {
        var c = await db.Campaigns.FindAsync([request.Id], cancellationToken);
        if (c is null || c.IsDeleted) return Result<bool>.Failure("Kampanya bulunamadı.");
        var oldImageUrl = c.ImageUrl;
        c.Title = request.Title; c.Subtitle = request.Subtitle; c.Icon = request.Icon;
        c.ColorScheme = request.ColorScheme; c.ImageUrl = request.ImageUrl; c.StylesJson = request.StylesJson;
        c.LinkUrl = request.LinkUrl; c.LinkText = request.LinkText;
        c.DisplayOrder = request.DisplayOrder; c.IsActive = request.IsActive;
        c.UpdatedDate = DateTime.UtcNow;
        // Cascade: resim siliniyorsa UploadedFiles'tan da kaldır
        if (string.IsNullOrEmpty(request.ImageUrl) && !string.IsNullOrEmpty(oldImageUrl))
        {
            var orphans = await db.UploadedFiles.Where(f => f.Url == oldImageUrl).ToListAsync(cancellationToken);
            if (orphans.Count > 0) db.UploadedFiles.RemoveRange(orphans);
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}

public record DeleteCampaignCommand(Guid Id) : IRequest<Result<bool>>;

public class DeleteCampaignHandler(IApplicationDbContext db) : IRequestHandler<DeleteCampaignCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteCampaignCommand request, CancellationToken cancellationToken)
    {
        var c = await db.Campaigns.FindAsync([request.Id], cancellationToken);
        if (c is null || c.IsDeleted) return Result<bool>.Failure("Kampanya bulunamadı.");
        c.IsDeleted = true; c.UpdatedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
