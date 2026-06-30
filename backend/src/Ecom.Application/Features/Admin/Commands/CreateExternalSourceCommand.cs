using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;

namespace Ecom.Application.Features.Admin.Commands;

public record CreateExternalSourceCommand(
    string Name,
    string? Code,
    string Type,
    string? Description,
    string? Config,
    string FetchSchedule = "None",
    string? AutoImportTarget = null
) : IRequest<Guid>;

public class CreateExternalSourceCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateExternalSourceCommand, Guid>
{
    public async Task<Guid> Handle(CreateExternalSourceCommand request, CancellationToken cancellationToken)
    {
        var code = string.IsNullOrWhiteSpace(request.Code) ? null : request.Code.Trim().ToUpperInvariant();
        if (code?.Length > 50) code = code[..50];
        var source = new ExternalSource
        {
            Name = request.Name,
            Code = code,
            Type = request.Type,
            Description = request.Description,
            Config = request.Config,
            IsActive = true,
            FetchSchedule = request.FetchSchedule,
            AutoImportTarget = request.AutoImportTarget,
            NextScheduledFetchAt = ComputeNext(request.FetchSchedule),
        };
        db.ExternalSources.Add(source);
        await db.SaveChangesAsync(cancellationToken);
        return source.Id;
    }

    internal static DateTime? ComputeNext(string schedule) => schedule switch
    {
        "Hourly" => DateTime.UtcNow.AddHours(1),
        "Daily"  => DateTime.UtcNow.AddDays(1),
        "Weekly" => DateTime.UtcNow.AddDays(7),
        _        => null,
    };
}
