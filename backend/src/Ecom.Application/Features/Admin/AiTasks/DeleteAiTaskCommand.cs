using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.AiTasks;

public record DeleteAiTaskCommand(Guid TaskId) : IRequest<bool>;

public class DeleteAiTaskHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteAiTaskCommand, bool>
{
    public async Task<bool> Handle(DeleteAiTaskCommand request, CancellationToken ct)
    {
        var task = await db.AiTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct);
        if (task is null) return false;

        task.IsDeleted = true;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
