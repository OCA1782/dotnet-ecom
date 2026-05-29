using Dapper;
using Ecom.Application.Common.Interfaces;
using MediatR;

namespace Ecom.Application.Features.Admin.Queries;

public record GetVisitorLogsQuery(
    int Page = 1,
    int PageSize = 50,
    string? IpAddress = null,
    Guid? UserId = null,
    string? Page2 = null,
    DateTime? From = null,
    DateTime? To = null
) : IRequest<GetVisitorLogsResult>;

public record VisitorLogDto(
    Guid Id,
    string? SessionId,
    Guid? UserId,
    string? UserFullName,
    string? IpAddress,
    string? UserAgent,
    string? Page,
    string? Country,
    string? City,
    double? Latitude,
    double? Longitude,
    string? Referrer,
    DateTime CreatedDate
);

public record GetVisitorLogsResult(List<VisitorLogDto> Items, int TotalCount);

public class GetVisitorLogsQueryHandler(IDapperQueryService dapper)
    : IRequestHandler<GetVisitorLogsQuery, GetVisitorLogsResult>
{
    public async Task<GetVisitorLogsResult> Handle(GetVisitorLogsQuery request, CancellationToken cancellationToken)
    {
        var where = new List<string> { "v.IsDeleted = 0" };
        var param = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(request.IpAddress))
        {
            where.Add("v.IpAddress = @IpAddress");
            param.Add("IpAddress", request.IpAddress);
        }
        if (request.UserId.HasValue)
        {
            where.Add("v.UserId = @UserId");
            param.Add("UserId", request.UserId.Value);
        }
        if (!string.IsNullOrWhiteSpace(request.Page2))
        {
            where.Add("v.Page LIKE @PageFilter");
            param.Add("PageFilter", $"%{request.Page2}%");
        }
        if (request.From.HasValue)
        {
            where.Add("v.CreatedDate >= @From");
            param.Add("From", request.From.Value);
        }
        if (request.To.HasValue)
        {
            where.Add("v.CreatedDate <= @To");
            param.Add("To", request.To.Value);
        }

        var whereClause = string.Join(" AND ", where);
        var offset = (request.Page - 1) * request.PageSize;
        param.Add("Offset", offset);
        param.Add("PageSize", request.PageSize);

        var countSql = $"SELECT COUNT(*) FROM VisitorLogs v WHERE {whereClause}";
        var dataSql = $@"
            SELECT v.Id, v.SessionId, v.UserId,
                   u.Name + ' ' + u.Surname AS UserFullName,
                   v.IpAddress, v.UserAgent, v.Page,
                   v.Country, v.City, v.Latitude, v.Longitude,
                   v.Referrer, v.CreatedDate
            FROM VisitorLogs v
            LEFT JOIN Users u ON u.Id = v.UserId
            WHERE {whereClause}
            ORDER BY v.CreatedDate DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var total = await dapper.QueryFirstOrDefaultAsync<int>(countSql, param, cancellationToken);
        var rows = await dapper.QueryAsync<VisitorLogRow>(dataSql, param, cancellationToken);

        var items = rows.Select(r => new VisitorLogDto(
            r.Id, r.SessionId, r.UserId, r.UserFullName,
            r.IpAddress, r.UserAgent, r.Page,
            r.Country, r.City, r.Latitude, r.Longitude,
            r.Referrer, r.CreatedDate
        )).ToList();

        return new GetVisitorLogsResult(items, total);
    }

    private record VisitorLogRow(
        Guid Id, string? SessionId, Guid? UserId, string? UserFullName,
        string? IpAddress, string? UserAgent, string? Page,
        string? Country, string? City, double? Latitude, double? Longitude,
        string? Referrer, DateTime CreatedDate
    );
}
