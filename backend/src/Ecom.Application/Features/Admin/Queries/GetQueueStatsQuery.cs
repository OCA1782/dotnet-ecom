using Ecom.Application.Common.Interfaces;
using MediatR;

namespace Ecom.Application.Features.Admin.Queries;

public record GetQueueStatsQuery : IRequest<QueueStatsDto>;

public record QueueStatsDto(
    int PendingCount,
    int ProcessedCount,
    int FailedCount,
    int TotalCount
);

public class GetQueueStatsQueryHandler(IDapperQueryService dapper)
    : IRequestHandler<GetQueueStatsQuery, QueueStatsDto>
{
    public async Task<QueueStatsDto> Handle(GetQueueStatsQuery request, CancellationToken cancellationToken)
    {
        var pending = await dapper.QueryFirstOrDefaultAsync<int>(
            "SELECT COUNT(*) FROM OutboxMessages WHERE ProcessedAt IS NULL AND RetryCount < 5",
            ct: cancellationToken);

        var processed = await dapper.QueryFirstOrDefaultAsync<int>(
            "SELECT COUNT(*) FROM OutboxMessages WHERE ProcessedAt IS NOT NULL",
            ct: cancellationToken);

        var failed = await dapper.QueryFirstOrDefaultAsync<int>(
            "SELECT COUNT(*) FROM OutboxMessages WHERE ProcessedAt IS NULL AND RetryCount >= 5",
            ct: cancellationToken);

        return new QueueStatsDto(pending, processed, failed, pending + processed + failed);
    }
}
