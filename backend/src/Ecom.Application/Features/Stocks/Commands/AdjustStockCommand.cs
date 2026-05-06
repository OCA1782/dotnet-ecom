using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;

namespace Ecom.Application.Features.Stocks.Commands;

public record AdjustStockCommand(
    Guid ProductId,
    Guid? VariantId,
    int Quantity,
    string MovementType,
    string? Note
) : IRequest<Result>;

public class AdjustStockValidator : AbstractValidator<AdjustStockCommand>
{
    private static readonly string[] AllowedTypes = ["StockIn", "StockOut", "Adjustment", "Damage"];

    public AdjustStockValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.MovementType)
            .NotEmpty()
            .Must(t => AllowedTypes.Contains(t))
            .WithMessage($"Geçerli hareket tipleri: {string.Join(", ", AllowedTypes)}");
    }
}

public class AdjustStockHandler(IStockService stockService, ICurrentUserService currentUser, IAuditService audit)
    : IRequestHandler<AdjustStockCommand, Result>
{
    public async Task<Result> Handle(AdjustStockCommand request, CancellationToken cancellationToken)
    {
        var result = await stockService.AdjustAsync(
            request.ProductId, request.VariantId,
            request.Quantity, request.MovementType, request.Note,
            currentUser.UserId, cancellationToken);

        if (result.Succeeded)
            await audit.LogAsync("StockAdjusted", "Stock",
                request.VariantId?.ToString() ?? request.ProductId.ToString(),
                newValue: $"{request.MovementType}:{request.Quantity}",
                cancellationToken: cancellationToken);

        return result;
    }
}
