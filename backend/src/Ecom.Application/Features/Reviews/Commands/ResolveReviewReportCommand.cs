using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Commands;

public record ResolveReviewReportCommand(Guid ReportId) : IRequest<Result>;

public class ResolveReviewReportHandler(IApplicationDbContext db)
    : IRequestHandler<ResolveReviewReportCommand, Result>
{
    public async Task<Result> Handle(ResolveReviewReportCommand request, CancellationToken cancellationToken)
    {
        var report = await db.ReviewReports
            .FirstOrDefaultAsync(r => r.Id == request.ReportId && !r.IsDeleted, cancellationToken);
        if (report is null)
            return Result.Failure("Şikayet bulunamadı.");

        report.IsResolved = true;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
