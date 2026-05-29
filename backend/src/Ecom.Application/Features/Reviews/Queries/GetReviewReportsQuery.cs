using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Queries;

public record GetReviewReportsQuery(Guid ReviewId) : IRequest<List<ReviewReportDto>>;

public record ReviewReportDto(
    Guid Id,
    Guid UserId,
    string UserName,
    string Reason,
    bool IsResolved,
    DateTime CreatedDate
);

public class GetReviewReportsHandler(IApplicationDbContext db)
    : IRequestHandler<GetReviewReportsQuery, List<ReviewReportDto>>
{
    public async Task<List<ReviewReportDto>> Handle(GetReviewReportsQuery request, CancellationToken cancellationToken)
    {
        return await db.ReviewReports
            .Include(r => r.User)
            .Where(r => r.ReviewId == request.ReviewId && !r.IsDeleted)
            .OrderByDescending(r => r.CreatedDate)
            .Select(r => new ReviewReportDto(
                r.Id,
                r.UserId,
                r.User.Name + " " + r.User.Surname,
                r.Reason,
                r.IsResolved,
                r.CreatedDate))
            .ToListAsync(cancellationToken);
    }
}
