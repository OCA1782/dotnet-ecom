using Ecom.Application.Common.Models;

namespace Ecom.Application.Common.Interfaces;

public interface IStockService
{
    /// <summary>Sipariş oluşturulurken stok rezerve eder.</summary>
    Task<Result> ReserveAsync(Guid productId, Guid? variantId, int quantity, Guid orderId, CancellationToken ct = default);

    /// <summary>Ödeme başarılıysa rezervi kesin stok düşümüne çevirir.</summary>
    Task<Result> ConfirmAsync(Guid productId, Guid? variantId, int quantity, Guid orderId, CancellationToken ct = default);

    /// <summary>Ödeme başarısızsa veya sipariş iptal edilirse rezervasyonu serbest bırakır.</summary>
    Task<Result> ReleaseReservationAsync(Guid productId, Guid? variantId, int quantity, Guid orderId, CancellationToken ct = default);

    /// <summary>İade sonrası stoğa geri alır.</summary>
    Task<Result> ReturnToStockAsync(Guid productId, Guid? variantId, int quantity, Guid orderId, string? note = null, CancellationToken ct = default);

    /// <summary>Manuel stok düzeltmesi (StockIn / StockOut / Adjustment).</summary>
    Task<Result> AdjustAsync(Guid productId, Guid? variantId, int quantity, string movementType, string? note, Guid? operatorUserId = null, int? criticalStockLevel = null, CancellationToken ct = default);
}
