using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;

namespace Ecom.Application.Features.Admin.AiTasks;

public record CreateAiTaskImageInput(string ImageUrl, string FileName, int SortOrder);

public record CreateAiTaskCommand(
    string Title,
    string Description,
    string Type,
    List<CreateAiTaskImageInput> Images
) : IRequest<Guid>;

public class CreateAiTaskHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateAiTaskCommand, Guid>
{
    public async Task<Guid> Handle(CreateAiTaskCommand request, CancellationToken ct)
    {
        var task = new AiTask
        {
            Title = request.Title,
            Description = request.Description,
            Type = request.Type,
            Status = "Pending",
            RequestedByUserId = currentUser.UserId,
        };

        foreach (var img in request.Images)
        {
            task.Images.Add(new AiTaskImage
            {
                ImageUrl = img.ImageUrl,
                FileName = img.FileName,
                SortOrder = img.SortOrder,
            });
        }

        db.AiTasks.Add(task);
        await db.SaveChangesAsync(ct);
        return task.Id;
    }
}
