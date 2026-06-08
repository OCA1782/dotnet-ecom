using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class PasswordReminderJob(IServiceScopeFactory scopeFactory) : IJobRunner
{
    public string Name => "PasswordReminderJob";
    public string Description => "Her 2 ayda bir şifresini değiştirmeyen kullanıcılara e-posta ve Telegram hatırlatması gönderir";
    public int IntervalMinutes => 1440; // Günde bir çalışır

    private const int PasswordAgeDays = 60; // 2 ay

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db       = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var email    = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var telegram = scope.ServiceProvider.GetRequiredService<ITelegramService>();

        var threshold = DateTime.UtcNow.AddDays(-PasswordAgeDays);

        // Admin ve SuperAdmin dışındaki aktif kullanıcılar
        var adminUserIds = await db.UserRoles
            .Where(r => r.Role == UserRole.Admin || r.Role == UserRole.SuperAdmin)
            .Select(r => r.UserId)
            .Distinct()
            .ToListAsync(ct);

        var users = await db.Users
            .Where(u => u.IsActive
                && !adminUserIds.Contains(u.Id)
                && (u.LastPasswordChangeDate.HasValue
                    ? u.LastPasswordChangeDate < threshold
                    : u.CreatedDate < threshold))
            .Select(u => new
            {
                u.Id, u.Name, u.Email, u.PhoneNumber,
                LastChange = u.LastPasswordChangeDate ?? u.CreatedDate
            })
            .ToListAsync(ct);

        if (users.Count == 0)
        {
            await log("  ✓ Şifre değiştirme hatırlatması gereken kullanıcı yok");
            return;
        }

        await log($"  ⚠ {users.Count} kullanıcıya şifre hatırlatması gönderiliyor:");

        var now = DateTime.UtcNow;
        int emailsSent = 0, errors = 0;
        var telegramLines = new List<string>();

        foreach (var u in users)
        {
            var days = (int)(now - u.LastChange).TotalDays;
            await log($"    - {u.Name} ({u.Email}) — {days} gün önce belirlendi");

            try
            {
                await email.SendPasswordReminderAsync(u.Email, u.Name, days, ct);
                emailsSent++;
            }
            catch (Exception ex)
            {
                await log($"      ✗ E-posta gönderilemedi: {ex.Message}");
                errors++;
            }

            if (!string.IsNullOrWhiteSpace(u.PhoneNumber))
                telegramLines.Add($"• {u.Name} ({u.Email}) — {days} gün");
        }

        if (telegramLines.Count > 0)
        {
            try
            {
                var msg = $"🔐 Şifre değiştirme hatırlatmaları ({telegramLines.Count} kullanıcı):\n"
                    + string.Join("\n", telegramLines)
                    + $"\n\nŞifre {PasswordAgeDays} günden eski olan kullanıcılar.";
                await telegram.SendAsync(msg, ct);
            }
            catch (Exception ex)
            {
                await log($"    ✗ Telegram gönderilemedi: {ex.Message}");
            }
        }

        await log($"  ✓ {emailsSent} e-posta gönderildi, {telegramLines.Count} Telegram bildirimi, {errors} hata");
    }
}
