namespace Ecom.Application.Common.Interfaces;

public interface ITelegramService
{
    Task SendAsync(string message, CancellationToken ct = default);
}
