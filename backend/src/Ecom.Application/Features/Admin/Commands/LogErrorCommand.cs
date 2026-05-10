using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;

namespace Ecom.Application.Features.Admin.Commands;

public record LogErrorCommand(
    string Source,
    string Level,
    string Message,
    string? StackTrace,
    string? Path,
    string? UserEmail,
    string? IpAddress,
    string? UserAgent,
    int? StatusCode
) : IRequest;

public class LogErrorHandler(IApplicationDbContext db) : IRequestHandler<LogErrorCommand>
{
    public async Task Handle(LogErrorCommand request, CancellationToken cancellationToken)
    {
        db.ErrorLogs.Add(new ErrorLog
        {
            Source = request.Source,
            Level = request.Level,
            Message = request.Message,
            StackTrace = request.StackTrace,
            Path = request.Path,
            UserEmail = request.UserEmail,
            IpAddress = request.IpAddress,
            UserAgent = request.UserAgent,
            StatusCode = request.StatusCode,
        });
        await db.SaveChangesAsync(cancellationToken);
    }
}
