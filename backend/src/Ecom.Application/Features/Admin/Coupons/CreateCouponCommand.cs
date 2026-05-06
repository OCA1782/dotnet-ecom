using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Coupons;

public class CreateCouponCommand : IRequest<Result<Guid>>
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CouponType Type { get; set; }
    public decimal Value { get; set; }
    public decimal MinOrderAmount { get; set; }
    public int? MaxUsageCount { get; set; }
    public int? MaxUsagePerUser { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class CreateCouponValidator : AbstractValidator<CreateCouponCommand>
{
    public CreateCouponValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Value).GreaterThan(0);
        RuleFor(x => x.Value).LessThanOrEqualTo(100).When(x => x.Type == CouponType.Percentage);
    }
}

public class CreateCouponHandler(IApplicationDbContext db) : IRequestHandler<CreateCouponCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCouponCommand request, CancellationToken cancellationToken)
    {
        var code = request.Code.Trim().ToUpperInvariant();

        if (await db.Coupons.AnyAsync(c => c.Code == code, cancellationToken))
            return Result<Guid>.Failure("Bu kupon kodu zaten kullanımda.");

        var coupon = new Coupon
        {
            Code = code,
            Description = request.Description,
            Type = request.Type,
            Value = request.Value,
            MinOrderAmount = request.MinOrderAmount,
            MaxUsageCount = request.MaxUsageCount,
            MaxUsagePerUser = request.MaxUsagePerUser,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = true
        };

        db.Coupons.Add(coupon);
        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(coupon.Id);
    }
}
