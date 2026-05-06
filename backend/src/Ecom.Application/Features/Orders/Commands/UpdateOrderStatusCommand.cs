using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Orders.Commands;

public record UpdateOrderStatusCommand(
    Guid OrderId,
    OrderStatus NewStatus,
    Guid? ChangedByUserId,
    string? Note = null
) : IRequest<Result>;

public class UpdateOrderStatusValidator : AbstractValidator<UpdateOrderStatusCommand>
{
    public UpdateOrderStatusValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.NewStatus).IsInEnum();
    }
}

public class UpdateOrderStatusHandler(IApplicationDbContext db) : IRequestHandler<UpdateOrderStatusCommand, Result>
{
    // Hangi statüden hangi statülere geçilebileceği
    private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
    {
        [OrderStatus.Created]          = [OrderStatus.PaymentPending, OrderStatus.Cancelled, OrderStatus.Failed],
        [OrderStatus.PaymentPending]   = [OrderStatus.PaymentCompleted, OrderStatus.Cancelled, OrderStatus.Failed],
        [OrderStatus.PaymentCompleted] = [OrderStatus.Preparing, OrderStatus.Cancelled],
        [OrderStatus.Preparing]        = [OrderStatus.Shipped, OrderStatus.Cancelled],
        [OrderStatus.Shipped]          = [OrderStatus.Delivered],
        [OrderStatus.Delivered]        = [OrderStatus.Completed, OrderStatus.RefundRequested],
        [OrderStatus.Completed]        = [OrderStatus.RefundRequested],
        [OrderStatus.RefundRequested]  = [OrderStatus.Refunded, OrderStatus.Completed],
        [OrderStatus.Cancelled]        = [],
        [OrderStatus.Failed]           = [],
        [OrderStatus.Refunded]         = [],
    };

    public async Task<Result> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null) return Result.Failure("Sipariş bulunamadı.");

        if (!AllowedTransitions.TryGetValue(order.Status, out var allowed) ||
            !allowed.Contains(request.NewStatus))
        {
            return Result.Failure($"'{order.Status}' statüsünden '{request.NewStatus}' statüsüne geçiş yapılamaz.");
        }

        var previousStatus = order.Status;
        order.Status = request.NewStatus;

        db.OrderStatusHistories.Add(new Domain.Entities.OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = previousStatus,
            ToStatus = request.NewStatus,
            ChangedByUserId = request.ChangedByUserId,
            Note = request.Note
        });

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
