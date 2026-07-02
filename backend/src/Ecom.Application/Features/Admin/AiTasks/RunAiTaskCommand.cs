using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.AiTasks;

public record RunAiTaskCommand(Guid TaskId) : IRequest<bool>;

public class RunAiTaskHandler(IApplicationDbContext db, IAiTaskQueue queue)
    : IRequestHandler<RunAiTaskCommand, bool>
{
    public async Task<bool> Handle(RunAiTaskCommand request, CancellationToken ct)
    {
        var task = await db.AiTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct);
        if (task is null) return false;

        if (task.Status == "Running") return true;

        task.Status = "Running";
        task.StartedAt = DateTime.UtcNow;
        task.CompletedAt = null;
        task.ResultText = null;
        task.ErrorMessage = null;
        task.RunCount++;

        await db.SaveChangesAsync(ct);
        queue.Enqueue(request.TaskId);
        return true;
    }
}
