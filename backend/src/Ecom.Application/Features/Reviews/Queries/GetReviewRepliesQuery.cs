using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Reviews.Queries;

public record GetReviewRepliesQuery(Guid ReviewId) : IRequest<List<ReviewReplyDto>>;

public record ReviewReplyDto(
    Guid Id,
    Guid UserId,
    string UserName,
    string Body,
    DateTime CreatedDate
);

public class GetReviewRepliesHandler(IApplicationDbContext db)
    : IRequestHandler<GetReviewRepliesQuery, List<ReviewReplyDto>>
{
    public async Task<List<ReviewReplyDto>> Handle(GetReviewRepliesQuery request, CancellationToken cancellationToken)
    {
        return await db.ReviewReplies
            .Include(r => r.User)
            .Where(r => r.ReviewId == request.ReviewId && !r.IsDeleted)
            .OrderBy(r => r.CreatedDate)
            .Select(r => new ReviewReplyDto(
                r.Id,
                r.UserId,
                r.User.Name + " " + r.User.Surname.Substring(0, 1) + ".",
                r.Body,
                r.CreatedDate))
            .ToListAsync(cancellationToken);
    }
}
