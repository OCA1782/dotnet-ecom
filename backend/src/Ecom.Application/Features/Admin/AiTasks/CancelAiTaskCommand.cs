using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.AiTasks;

public record CancelAiTaskCommand(Guid TaskId) : IRequest<bool>;

public class CancelAiTaskHandler(IApplicationDbContext db, IAiTaskQueue queue)
    : IRequestHandler<CancelAiTaskCommand, bool>
{
    public async Task<bool> Handle(CancelAiTaskCommand request, CancellationToken ct)
    {
        var task = await db.AiTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct);
        if (task is null) return false;

        if (task.Status != "Running" && task.Status != "Pending") return false;

        queue.Cancel(request.TaskId);

        task.Status = "Cancelled";
        task.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
