using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Orders.Commands;

// Müşterinin kendi siparişi için iade talebi oluşturduğu komut.
// Yalnızca Delivered (6) veya Completed (7) durumundaki siparişler için geçerlidir.
public record RequestRefundCommand(Guid UserId, string OrderNumber, string? Reason) : IRequest<Result>;

public class RequestRefundCommandValidator : AbstractValidator<RequestRefundCommand>
{
    public RequestRefundCommandValidator()
    {
        RuleFor(x => x.OrderNumber).NotEmpty().WithMessage("Sipariş numarası zorunludur.");
    }
}

public class RequestRefundCommandHandler(IApplicationDbContext db) : IRequestHandler<RequestRefundCommand, Result>
{
    // İade talebi açılabilecek sipariş durumları: Teslim Edildi ve Tamamlandı
    private static readonly OrderStatus[] EligibleStatuses = [OrderStatus.Delivered, OrderStatus.Completed];

    public async Task<Result> Handle(RequestRefundCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber, cancellationToken);

        if (order is null) return Result.Failure("Sipariş bulunamadı.");
        // Siparişin gerçekten bu kullanıcıya ait olduğunu doğrula
        if (order.UserId != request.UserId) return Result.Failure("Bu siparişe erişim yetkiniz yok.");
        if (!EligibleStatuses.Contains(order.Status))
            return Result.Failure("İade talebi yalnızca teslim edilmiş veya tamamlanmış siparişler için oluşturulabilir.");

        var fromStatus = order.Status;
        order.Status = OrderStatus.RefundRequested;

        // Durum geçişini izlenebilirlik için StatusHistory'ye yaz
        db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = fromStatus,
            ToStatus = OrderStatus.RefundRequested,
            ChangedByUserId = request.UserId,
            Note = string.IsNullOrWhiteSpace(request.Reason) ? "Müşteri iade talebi" : request.Reason,
        });

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
