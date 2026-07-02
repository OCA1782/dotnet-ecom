namespace Ecom.Application.Common.Interfaces;

public interface IAiTaskQueue
{
    void Enqueue(Guid taskId);
    void Cancel(Guid taskId);
}
