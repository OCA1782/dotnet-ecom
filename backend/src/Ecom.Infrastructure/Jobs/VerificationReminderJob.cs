using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class VerificationReminderJob(IServiceScopeFactory scopeFactory) : IJobRunner
{
    public string Name => "VerificationReminderJob";
    public string Description => "Doğrulanmamış hesaplara günde 2 kez e-posta ve Telegram hatırlatması gönderir";
    public int IntervalMinutes => 720;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db       = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var email    = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var telegram = scope.ServiceProvider.GetRequiredService<ITelegramService>();

        var cutoff = DateTime.UtcNow.AddHours(-1);

        var users = await db.Users
            .Where(u => u.IsActive
                && u.CreatedDate < cutoff
                && (!u.EmailConfirmed || !u.PhoneConfirmed))
            .Select(u => new
            {
                u.Id, u.Name, u.Surname, u.Email,
                u.PhoneNumber, u.EmailConfirmed, u.PhoneConfirmed
            })
            .ToListAsync(ct);

        if (users.Count == 0)
        {
            await log("  ✓ Doğrulanmamış kullanıcı yok");
            return;
        }

        await log($"  ⚠ {users.Count} kullanıcı doğrulanmamış:");

        var now = DateTime.UtcNow;
        int emailsSent = 0, errors = 0;
        var telegramLines = new List<string>();

        foreach (var u in users)
        {
            await log($"    - {u.Name} {u.Surname} ({u.Email}) — email:{(u.EmailConfirmed ? "✓" : "✗")} telefon:{(u.PhoneConfirmed ? "✓" : "✗")}");

            var dbUser = await db.Users.FindAsync([u.Id], ct);
            if (dbUser is null) continue;

            if (!u.EmailConfirmed)
            {
                var code = Random.Shared.Next(100_000, 999_999).ToString();
                dbUser.EmailVerificationCode = code;
                dbUser.EmailVerificationCodeExpiry = now.AddHours(24);

                try
                {
                    await email.SendVerificationReminderAsync(u.Email, u.Name, code, ct);
                    emailsSent++;
                }
                catch (Exception ex)
                {
                    await log($"      ✗ E-posta gönderilemedi: {ex.Message}");
                    errors++;
                }
            }

            if (!u.PhoneConfirmed)
            {
                var code = Random.Shared.Next(100_000, 999_999).ToString();
                dbUser.TelegramVerificationCode = code;
                dbUser.TelegramVerificationCodeExpiry = now.AddHours(24);
                telegramLines.Add($"• {u.Name} {u.Surname} ({u.Email}) — Kod: {code}");
            }
        }

        await db.SaveChangesAsync(ct);

        if (telegramLines.Count > 0)
        {
            try
            {
                var msg = $"📱 Telefon doğrulama hatırlatmaları ({telegramLines.Count} kullanıcı):\n" + string.Join("\n", telegramLines);
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
