using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record UpsertSalesGoalCommand(int Year, int Month, decimal TargetRevenue, int TargetOrderCount) : IRequest<Result>;

public class UpsertSalesGoalHandler(IApplicationDbContext db) : IRequestHandler<UpsertSalesGoalCommand, Result>
{
    public async Task<Result> Handle(UpsertSalesGoalCommand request, CancellationToken cancellationToken)
    {
        var goal = await db.SalesGoals
            .FirstOrDefaultAsync(g => g.Year == request.Year && g.Month == request.Month, cancellationToken);

        if (goal is null)
        {
            goal = new SalesGoal { Year = request.Year, Month = request.Month };
            db.SalesGoals.Add(goal);
        }

        goal.TargetRevenue = request.TargetRevenue;
        goal.TargetOrderCount = request.TargetOrderCount;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
