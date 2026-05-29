using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ShippingCarrier : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;    // "yurtici", "aras", "mng" etc.
    public bool IsActive { get; set; } = true;
    public decimal BasePrice { get; set; }               // base shipping cost (TRY)
    public decimal? FreeShippingThreshold { get; set; } // cart total for free shipping
    public int EstimatedDays { get; set; } = 1;
    public decimal? MaxWeightKg { get; set; }
    public string? TrackingUrlTemplate { get; set; }    // https://track.example.com/{0}
    public string? LogoUrl { get; set; }
    public string? ApiEndpoint { get; set; }            // for future API integration
    public string? ApiKey { get; set; }                 // stored encrypted in production
    public string? Notes { get; set; }
    // Weight-based pricing as JSON array: [{minKg,maxKg,price}]
    public string? WeightPricingJson { get; set; }
}
