using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Coupons;

public class UpdateCouponCommand : IRequest<Result>
{
    public Guid Id { get; set; }
    public string? Description { get; set; }
    public decimal Value { get; set; }
    public decimal MinOrderAmount { get; set; }
    public int? MaxUsageCount { get; set; }
    public int? MaxUsagePerUser { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateCouponHandler(IApplicationDbContext db, IAuditService audit) : IRequestHandler<UpdateCouponCommand, Result>
{
    public async Task<Result> Handle(UpdateCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await db.Coupons.FindAsync([request.Id], cancellationToken);
        if (coupon is null) return Result.Failure("Kupon bulunamadı.");

        var changes = new List<string>();
        if (coupon.Value != request.Value) changes.Add($"Değer: {coupon.Value} → {request.Value}");
        if (coupon.MinOrderAmount != request.MinOrderAmount) changes.Add($"Min. Tutar: {coupon.MinOrderAmount} → {request.MinOrderAmount}");
        if (coupon.MaxUsageCount != request.MaxUsageCount) changes.Add($"Maks. Kullanım: {coupon.MaxUsageCount?.ToString() ?? "—"} → {request.MaxUsageCount?.ToString() ?? "—"}");
        if (coupon.IsActive != request.IsActive) changes.Add($"Durum: {(coupon.IsActive ? "Aktif" : "Pasif")} → {(request.IsActive ? "Aktif" : "Pasif")}");
        if (coupon.EndDate != request.EndDate) changes.Add($"Bitiş: {(coupon.EndDate.HasValue ? coupon.EndDate.Value.ToString("dd.MM.yyyy") : "—")} → {(request.EndDate.HasValue ? request.EndDate.Value.ToString("dd.MM.yyyy") : "—")}");

        coupon.Description = request.Description;
        coupon.Value = request.Value;
        coupon.MinOrderAmount = request.MinOrderAmount;
        coupon.MaxUsageCount = request.MaxUsageCount;
        coupon.MaxUsagePerUser = request.MaxUsagePerUser;
        coupon.StartDate = request.StartDate;
        coupon.EndDate = request.EndDate;
        coupon.IsActive = request.IsActive;

        await db.SaveChangesAsync(cancellationToken);
        var detail = changes.Count > 0 ? string.Join(" | ", changes) : null;
        await audit.LogAsync("KuponGüncellendi", "Kupon", coupon.Id.ToString(), null, detail, cancellationToken: cancellationToken);
        return Result.Success();
    }
}
