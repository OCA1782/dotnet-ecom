using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Renci.SshNet;
using System.Text;

namespace Ecom.Infrastructure.Services;

public class DeployService(
    IServiceScopeFactory scopeFactory,
    IDeployStreamHub hub,
    IDataProtectionProvider dataProtection) : IDeployService
{
    private readonly IDataProtector _protector = dataProtection.CreateProtector("DeployCredentials");

    public async Task<Guid> StartDeployAsync(Guid serverId, string triggeredBy, CancellationToken ct = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var server = await db.DeployServers
            .FirstOrDefaultAsync(s => s.Id == serverId && s.IsActive, ct)
            ?? throw new InvalidOperationException("Sunucu bulunamadı.");

        var log = new DeployLog
        {
            ServerId = serverId,
            TriggeredBy = triggeredBy,
            StartedAt = DateTime.UtcNow,
            Status = "running",
            Branch = server.Branch,
        };
        db.DeployLogs.Add(log);
        await db.SaveChangesAsync(ct);

        hub.CreateChannel(log.Id);

        // Run deploy in background — don't await
        _ = Task.Run(() => RunDeployAsync(log.Id, server.Id, server), CancellationToken.None);

        return log.Id;
    }

    private async Task RunDeployAsync(Guid logId, Guid serverId, DeployServer server)
    {
        var logBuilder = new StringBuilder();
        var success = false;
        string? errorMessage = null;
        var startTime = DateTime.UtcNow;

        async Task Log(string line)
        {
            logBuilder.AppendLine(line);
            await hub.WriteAsync(logId, line);
        }

        SshClient? ssh = null;
        try
        {
            await Log($"[{DateTime.UtcNow:HH:mm:ss}] 🚀 Deploy başlıyor — {server.Name} ({server.Environment})");
            await Log($"[{DateTime.UtcNow:HH:mm:ss}] Sunucu: {server.Host}:{server.Port} | Dal: {server.Branch}");
            await Log("─────────────────────────────────────────────");

            // ── Step 1: SSH bağlantısı ──────────────────────────────────
            await Log($"[ADIM 1/6] SSH bağlantısı kuruluyor → {server.Username}@{server.Host}:{server.Port}");

            ConnectionInfo connInfo;
            if (server.AuthType == "sshkey" && !string.IsNullOrEmpty(server.EncryptedCredential))
            {
                var keyText = _protector.Unprotect(server.EncryptedCredential);
                var keyBytes = Encoding.UTF8.GetBytes(keyText);
                using var keyStream = new MemoryStream(keyBytes);
                var keyFile = new PrivateKeyFile(keyStream);
                connInfo = new ConnectionInfo(server.Host, server.Port, server.Username,
                    new PrivateKeyAuthenticationMethod(server.Username, keyFile));
            }
            else
            {
                var password = string.IsNullOrEmpty(server.EncryptedCredential) ? ""
                    : _protector.Unprotect(server.EncryptedCredential);
                connInfo = BuildPasswordConnInfo(server.Host, server.Port, server.Username, password);
            }

            ssh = new SshClient(connInfo);
            ssh.Connect();
            await Log($"  ✓ Bağlantı başarılı");

            // ── Step 2: Git fetch ────────────────────────────────────────
            await Log($"\n[ADIM 2/6] Git — en güncel kod çekiliyor (origin/{server.Branch})");
            await RunCmd(ssh, $"cd {server.DeployPath} && git fetch origin {server.Branch} 2>&1", Log);
            await RunCmd(ssh, $"cd {server.DeployPath} && git reset --hard origin/{server.Branch} 2>&1", Log);

            // Commit hash
            var hashResult = await RunCmdCapture(ssh, $"cd {server.DeployPath} && git rev-parse --short HEAD 2>/dev/null");
            var commitHash = hashResult.Trim();
            await Log($"  → Commit: {commitHash}");

            // ── Step 3: Docker build ─────────────────────────────────────
            await Log($"\n[ADIM 3/6] Docker — image build ediliyor (bu adım uzun sürebilir...)");
            var composeCmd = server.ComposeFile != "docker-compose.yml"
                ? $"-f {server.ComposeFile}"
                : "";
            await RunCmd(ssh, $"cd {server.DeployPath} && docker compose {composeCmd} build 2>&1", Log);

            // ── Step 4: Docker up ─────────────────────────────────────────
            await Log($"\n[ADIM 4/6] Docker — container'lar yeniden başlatılıyor");
            await RunCmd(ssh, $"cd {server.DeployPath} && docker compose {composeCmd} up -d 2>&1", Log);

            // ── Step 5: Cleanup ───────────────────────────────────────────
            await Log($"\n[ADIM 5/6] Eski image'lar temizleniyor");
            await RunCmd(ssh, "docker image prune -f 2>&1", Log);

            // ── Step 6: Health check ──────────────────────────────────────
            await Log($"\n[ADIM 6/6] Sağlık kontrolü yapılıyor...");
            await Task.Delay(8000); // wait for services to start
            if (!string.IsNullOrEmpty(server.HealthCheckUrl))
            {
                var healthResult = await RunCmdCapture(ssh,
                    $"curl -sf --max-time 10 \"{server.HealthCheckUrl}\" -o /dev/null -w \"%{{http_code}}\" 2>/dev/null");
                var statusCode = healthResult.Trim();
                if (statusCode == "200")
                    await Log($"  ✓ Health check başarılı (HTTP {statusCode})");
                else
                    await Log($"  ⚠ Health check yanıt: HTTP {(string.IsNullOrEmpty(statusCode) ? "timeout" : statusCode)}");
            }
            else
            {
                await Log("  (Health check URL tanımlı değil — atlandı)");
            }

            await Log("\n─────────────────────────────────────────────");
            await Log($"✅ DEPLOY TAMAMLANDI — {server.Name}");
            success = true;
        }
        catch (Exception ex)
        {
            errorMessage = ex.Message;
            await Log($"\n❌ HATA: {ex.Message}");
            if (ex.InnerException != null)
                await Log($"   Detay: {ex.InnerException.Message}");
        }
        finally
        {
            ssh?.Disconnect();
            ssh?.Dispose();

            var duration = (int)(DateTime.UtcNow - startTime).TotalSeconds;
            await Log($"\n⏱ Toplam süre: {duration}s");
            await hub.WriteAsync(logId, $"__DONE__{(success ? "success" : "failed")}");
            hub.Complete(logId);

            // Persist to DB
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            var log = await db.DeployLogs.FindAsync(logId);
            if (log != null)
            {
                log.Status = success ? "success" : "failed";
                log.FinishedAt = DateTime.UtcNow;
                log.DurationSeconds = duration;
                log.FullLog = logBuilder.ToString();
                log.ErrorMessage = errorMessage;

                var svr = await db.DeployServers.FindAsync(serverId);
                if (svr != null)
                {
                    svr.LastDeployAt = DateTime.UtcNow;
                    svr.LastDeployStatus = log.Status;
                    svr.LastDeployDurationSeconds = duration;
                }
                await db.SaveChangesAsync();
            }
        }
    }

    private static async Task RunCmd(SshClient ssh, string command, Func<string, Task> log)
    {
        using var cmd = ssh.CreateCommand(command);
        cmd.CommandTimeout = TimeSpan.FromMinutes(20);
        var asyncResult = cmd.BeginExecute();

        using var stdoutReader = new System.IO.StreamReader(cmd.OutputStream);
        using var stderrReader = new System.IO.StreamReader(cmd.ExtendedOutputStream);

        while (!asyncResult.IsCompleted || stdoutReader.Peek() > -1 || stderrReader.Peek() > -1)
        {
            while (stdoutReader.Peek() > -1)
            {
                var line = stdoutReader.ReadLine();
                if (!string.IsNullOrWhiteSpace(line)) await log($"  {line}");
            }
            while (stderrReader.Peek() > -1)
            {
                var line = stderrReader.ReadLine();
                if (!string.IsNullOrWhiteSpace(line)) await log($"  [err] {line}");
            }
            if (!asyncResult.IsCompleted) await Task.Delay(150);
        }
        cmd.EndExecute(asyncResult);
    }

    private static async Task<string> RunCmdCapture(SshClient ssh, string command)
    {
        using var cmd = ssh.CreateCommand(command);
        cmd.CommandTimeout = TimeSpan.FromSeconds(30);
        return await Task.Run(() => cmd.Execute());
    }

    public async Task<string> TestConnectionAsync(Guid serverId, CancellationToken ct = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var server = await db.DeployServers.FindAsync(serverId, ct)
            ?? throw new InvalidOperationException("Sunucu bulunamadı.");

        SshClient? ssh = null;
        try
        {
            ConnectionInfo connInfo;
            if (server.AuthType == "sshkey" && !string.IsNullOrEmpty(server.EncryptedCredential))
            {
                var keyText = _protector.Unprotect(server.EncryptedCredential);
                var keyBytes = Encoding.UTF8.GetBytes(keyText);
                using var keyStream = new MemoryStream(keyBytes);
                connInfo = new ConnectionInfo(server.Host, server.Port, server.Username,
                    new PrivateKeyAuthenticationMethod(server.Username, new PrivateKeyFile(keyStream)));
            }
            else
            {
                var password = string.IsNullOrEmpty(server.EncryptedCredential) ? ""
                    : _protector.Unprotect(server.EncryptedCredential);
                connInfo = BuildPasswordConnInfo(server.Host, server.Port, server.Username, password);
            }

            ssh = new SshClient(connInfo);
            ssh.ConnectionInfo.Timeout = TimeSpan.FromSeconds(10);
            ssh.Connect();
            var result = ssh.RunCommand("echo ok && uname -a").Result;
            return $"✓ Bağlantı başarılı\n{result}";
        }
        finally
        {
            ssh?.Disconnect();
            ssh?.Dispose();
        }
    }

    public async Task<string> GetContainerStatusAsync(Guid serverId, CancellationToken ct = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var server = await db.DeployServers.FindAsync(serverId, ct)
            ?? throw new InvalidOperationException("Sunucu bulunamadı.");

        SshClient? ssh = null;
        try
        {
            var password = string.IsNullOrEmpty(server.EncryptedCredential) ? ""
                : _protector.Unprotect(server.EncryptedCredential);
            var connInfo = BuildPasswordConnInfo(server.Host, server.Port, server.Username, password);
            ssh = new SshClient(connInfo);
            ssh.ConnectionInfo.Timeout = TimeSpan.FromSeconds(10);
            ssh.Connect();
            return ssh.RunCommand(
                "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}' 2>&1").Result;
        }
        finally
        {
            ssh?.Disconnect();
            ssh?.Dispose();
        }
    }

    public string EncryptCredential(string plaintext) => _protector.Protect(plaintext);
    public string DecryptCredential(string encrypted) => _protector.Unprotect(encrypted);

    // Tries both `password` and `keyboard-interactive` (PAM) — Hetzner root requires the latter.
    private static ConnectionInfo BuildPasswordConnInfo(string host, int port, string username, string password)
    {
        var kbdInteractive = new KeyboardInteractiveAuthenticationMethod(username);
        kbdInteractive.AuthenticationPrompt += (_, e) =>
        {
            foreach (var prompt in e.Prompts)
                prompt.Response = password;
        };
        return new ConnectionInfo(host, port, username,
            new PasswordAuthenticationMethod(username, password),
            kbdInteractive);
    }
}
