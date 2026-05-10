using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record SalesGoalDto(Guid Id, int Year, int Month, decimal TargetRevenue, int TargetOrderCount);

public record GetSalesGoalsQuery(int Year) : IRequest<List<SalesGoalDto>>;

public class GetSalesGoalsHandler(IApplicationDbContext db) : IRequestHandler<GetSalesGoalsQuery, List<SalesGoalDto>>
{
    public async Task<List<SalesGoalDto>> Handle(GetSalesGoalsQuery request, CancellationToken cancellationToken)
    {
        return await db.SalesGoals
            .Where(g => g.Year == request.Year)
            .OrderBy(g => g.Month)
            .Select(g => new SalesGoalDto(g.Id, g.Year, g.Month, g.TargetRevenue, g.TargetOrderCount))
            .ToListAsync(cancellationToken);
    }
}
