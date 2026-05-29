using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record DeleteAnnouncementCommand(Guid Id) : IRequest<bool>;

public class DeleteAnnouncementHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteAnnouncementCommand, bool>
{
    public async Task<bool> Handle(DeleteAnnouncementCommand request, CancellationToken ct)
    {
        var item = await db.Announcements
            .FirstOrDefaultAsync(a => a.Id == request.Id, ct);

        if (item is null) return false;

        item.IsDeleted = true;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
