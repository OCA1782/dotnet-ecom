using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;

namespace Ecom.Application.Features.Admin.Commands;

public record CreateAnnouncementCommand(
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
) : IRequest<Guid>;

public class CreateAnnouncementHandler(IApplicationDbContext db)
    : IRequestHandler<CreateAnnouncementCommand, Guid>
{
    public async Task<Guid> Handle(CreateAnnouncementCommand request, CancellationToken ct)
    {
        var announcement = new Announcement
        {
            Title = request.Title,
            Summary = request.Summary,
            Content = request.Content,
            MediaUrl = request.MediaUrl,
            MediaType = request.MediaType,
            Category = request.Category,
            LinkUrl = request.LinkUrl,
            LinkText = request.LinkText,
            IsActive = request.IsActive,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            DisplayOrder = request.DisplayOrder,
        };

        db.Announcements.Add(announcement);
        await db.SaveChangesAsync(ct);
        return announcement.Id;
    }
}
