using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record UpdateAnnouncementCommand(
    Guid Id,
    string Title,
    string? Summary,
    string? Content,
    string? MediaUrl,
    string MediaType,
    string Category,
    string? LinkUrl,
    string? LinkText,
    bool IsActive,
    DateTime? StartsAt,
    DateTime? EndsAt,
    int DisplayOrder
) : IRequest<bool>;

public class UpdateAnnouncementHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateAnnouncementCommand, bool>
{
    public async Task<bool> Handle(UpdateAnnouncementCommand request, CancellationToken ct)
    {
        var item = await db.Announcements
            .FirstOrDefaultAsync(a => a.Id == request.Id, ct);

        if (item is null) return false;

        var oldMediaUrl = item.MediaUrl;
        item.Title = request.Title;
        item.Summary = request.Summary;
        item.Content = request.Content;
        item.MediaUrl = request.MediaUrl;
        item.MediaType = request.MediaType;
        item.Category = request.Category;
        item.LinkUrl = request.LinkUrl;
        item.LinkText = request.LinkText;
        item.IsActive = request.IsActive;
        item.StartsAt = request.StartsAt;
        item.EndsAt = request.EndsAt;
        item.DisplayOrder = request.DisplayOrder;

        // Cascade: medya siliniyorsa UploadedFiles'tan da kaldır
        if (string.IsNullOrEmpty(request.MediaUrl) && !string.IsNullOrEmpty(oldMediaUrl))
        {
            var orphans = await db.UploadedFiles.Where(f => f.Url == oldMediaUrl).ToListAsync(ct);
            if (orphans.Count > 0) db.UploadedFiles.RemoveRange(orphans);
        }

        await db.SaveChangesAsync(ct);
        return true;
    }
}
