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
    int? StatusCode,
    string? ExceptionType = null,
    string? Url = null
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
            Url = request.Url,
            UserEmail = request.UserEmail,
            IpAddress = request.IpAddress,
            UserAgent = request.UserAgent,
            StatusCode = request.StatusCode,
            ExceptionType = request.ExceptionType,
        });
        await db.SaveChangesAsync(cancellationToken);
    }
}
