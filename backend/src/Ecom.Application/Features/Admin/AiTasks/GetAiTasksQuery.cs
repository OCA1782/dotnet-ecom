using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.AiTasks;

public record AiTaskImageDto(Guid Id, string ImageUrl, string FileName, int SortOrder);

public record AiTaskDto(
    Guid Id,
    string Title,
    string Description,
    string Type,
    string Status,
    string? ResultText,
    string? ErrorMessage,
    int RunCount,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    DateTime CreatedDate,
    List<AiTaskImageDto> Images
);

public record GetAiTasksQuery(
    int Page = 1,
    int PageSize = 20,
    string? Status = null,
    string? Type = null,
    string? Search = null
) : IRequest<PaginatedList<AiTaskDto>>;

public class GetAiTasksHandler(IApplicationDbContext db)
    : IRequestHandler<GetAiTasksQuery, PaginatedList<AiTaskDto>>
{
    public async Task<PaginatedList<AiTaskDto>> Handle(GetAiTasksQuery request, CancellationToken ct)
    {
        var query = db.AiTasks.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(x => x.Status == request.Status);

        if (!string.IsNullOrWhiteSpace(request.Type))
            query = query.Where(x => x.Type == request.Type);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.Title.Contains(request.Search) || x.Description.Contains(request.Search));

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(x => x.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new AiTaskDto(
                x.Id, x.Title, x.Description, x.Type, x.Status,
                x.ResultText, x.ErrorMessage, x.RunCount,
                x.StartedAt, x.CompletedAt, x.CreatedDate,
                x.Images.OrderBy(i => i.SortOrder).Select(i => new AiTaskImageDto(i.Id, i.ImageUrl, i.FileName, i.SortOrder)).ToList()
            ))
            .ToListAsync(ct);

        return PaginatedList<AiTaskDto>.Create(items, total, request.Page, request.PageSize);
    }
}
