using Ecom.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Ecom.API.Controllers.Admin;

/// <summary>
/// One-shot data migration from SQL Server (LocalDB) → PostgreSQL.
/// Only callable by SuperAdmin. Run once after switching providers.
/// </summary>
[ApiController]
[Route("api/admin/data-migration")]
[Authorize(Roles = "SuperAdmin")]
public class DataMigrationController(
    ApplicationDbContext db,
    IConfiguration configuration,
    IServiceScopeFactory scopeFactory,
    ILogger<DataMigrationController> logger) : ControllerBase
{
    // Shared migration state (process-lifetime, not persisted)
    private static volatile string _state = "idle"; // idle | running | done | error
    private static readonly StringBuilder _progressLog = new();
    private static int _migrated;
    private static int _total;
    // Table migration order respects FK dependencies.
    // session_replication_role=replica disables FK checks, but this order
    // also lets us truncate safely in reverse.
    private static readonly string[] MigrationOrder =
    [
        "Users", "UserRoles", "UserAddresses", "UserRefreshTokens",
        "Categories", "Brands",
        "ExternalSources",
        "Products", "ProductImages", "ProductVariants",
        "Stocks", "StockMovements",
        "SiteSettings",
        "Coupons", "CouponUsages",
        "Carts", "CartItems",
        "Orders", "OrderItems", "OrderStatusHistories", "Payments", "Shipments",
        "Invoices", "InvoiceItems",
        "ProductReviews", "ReviewLikes", "ReviewReplies", "ReviewReports",
        "WishlistItems",
        "ExternalSourceImportLogs", "ImportJobs",
        "OutboxMessages",
        "AuditLogs", "ErrorLogs", "VisitorLogs",
        "JobLogs", "MailLogs", "MailTemplates",
        "AlertConditions", "SalesGoals",
        "Licenses", "LicenseAssignments",
        "Announcements",
        "DeployServers", "DeployLogs",
        "Campaigns", "ShippingCarriers",
        "UploadedFiles",
        "AiTasks", "AiTaskImages",
        "OrderSagaStates",
    ];

    [HttpGet("status")]
    public async Task<IActionResult> Status(CancellationToken ct)
    {
        var counts = new Dictionary<string, long>();
        foreach (var table in new[] { "Products", "Categories", "Brands", "Users", "SiteSettings" })
        {
            try
            {
                var count = await db.Database
                    .SqlQueryRaw<long>($"SELECT COUNT(*) AS \"Value\" FROM \"{table}\"")
                    .FirstOrDefaultAsync(ct);
                counts[table] = count;
            }
            catch { counts[table] = -1; }
        }
        return Ok(new
        {
            provider = db.Database.ProviderName,
            migration = new { state = _state, migrated = _migrated, total = _total },
            counts
        });
    }

    [HttpGet("progress")]
    public IActionResult Progress() =>
        Ok(new { state = _state, migrated = _migrated, total = _total, log = _progressLog.ToString() });

    [HttpPost("mssql-to-pgsql")]
    public IActionResult MigrateMssqlToPgsql([FromQuery] bool dryRun = false)
    {
        if (!db.Database.ProviderName!.Contains("Npgsql"))
            return BadRequest("Bu endpoint yalnızca Database:Provider=PostgreSQL modunda çalışır.");

        if (_state == "running")
            return Conflict(new { error = "Migration zaten devam ediyor.", state = _state, migrated = _migrated });

        var mssqlConnStr = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(mssqlConnStr) || !mssqlConnStr.Contains("Server=", StringComparison.OrdinalIgnoreCase))
            return BadRequest("DefaultConnection bir SQL Server bağlantı dizisi değil.");

        _state = "running";
        _migrated = 0;
        _total = 0;
        _progressLog.Clear();

        // Fire-and-forget: migration runs without HTTP request's CT
        _ = Task.Run(() => RunMigrationAsync(mssqlConnStr, dryRun));

        return Accepted(new { message = "Migration arka planda başladı.", dryRun, progressUrl = "/api/admin/data-migration/progress" });
    }

    private async Task RunMigrationAsync(string mssqlConnStr, bool dryRun)
    {
        void Log(string msg) { _progressLog.AppendLine(msg); logger.LogInformation("{Msg}", msg); }

        try
        {
            Log($"=== MSSQL → PostgreSQL Migration {(dryRun ? "(DRY RUN) " : "")}Başlıyor ===");

            using var sqlConn = new SqlConnection(mssqlConnStr);
            await sqlConn.OpenAsync();
            Log("✓ MSSQL bağlantısı açıldı");

            // Get a fresh scope with a fresh DbContext (to avoid tracking conflicts)
            await using var scope = scopeFactory.CreateAsyncScope();
            var pgDb = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            if (!dryRun)
            {
                Log("Tablolar temizleniyor...");
                // Single statement — one connection, CASCADE resolves FK deps automatically
                var tableList = string.Join(", ", MigrationOrder.Select(t => $"\"{t}\""));
                try { await pgDb.Database.ExecuteSqlRawAsync($"TRUNCATE {tableList} RESTART IDENTITY CASCADE;"); }
                catch (Exception ex) { Log($"⚠ Truncate hatası: {ex.Message}"); }
                Log("✓ PostgreSQL tabloları temizlendi");
            }

            // Count total rows for progress tracking
            _total = await CountTotalRowsAsync(mssqlConnStr, pgDb);
            Log($"Toplam aktarılacak: {_total} kayıt");

            foreach (var tableName in MigrationOrder)
            {
                var entityType = pgDb.Model.GetEntityTypes()
                    .FirstOrDefault(e => e.GetTableName() == tableName);

                if (entityType == null) { Log($"SKIP {tableName}"); continue; }

                try
                {
                    var count = await MigrateTableAsync(tableName, entityType.ClrType, sqlConn, dryRun, pgDb);
                    _migrated += count;
                    Log($"✓ {tableName}: {count} kayıt ({_migrated}/{_total})");
                }
                catch (Exception ex)
                {
                    var inner = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
                    Log($"⚠ {tableName} HATA: {inner}");
                    logger.LogError(ex, "Migration hatası: {Table}", tableName);
                }
            }

            Log($"\n=== Tamamlandı: {_migrated} kayıt ===");
            _state = "done";
        }
        catch (Exception ex)
        {
            _progressLog.AppendLine($"KRITIK HATA: {ex.Message}");
            logger.LogError(ex, "Migration kritik hata");
            _state = "error";
        }
    }

    private static async Task<int> CountTotalRowsAsync(string mssqlConnStr, ApplicationDbContext pgDb)
    {
        int total = 0;
        using var sqlConn = new SqlConnection(mssqlConnStr);
        await sqlConn.OpenAsync();
        foreach (var tableName in MigrationOrder)
        {
            try
            {
                using var cmd = new SqlCommand($"SELECT COUNT(*) FROM [{tableName}] WITH (NOLOCK)", sqlConn) { CommandTimeout = 60 };
                var n = (int)(cmd.ExecuteScalar() ?? 0);
                total += n;
            }
            catch { }
        }
        return total;
    }

    private async Task<int> MigrateTableAsync(
        string tableName, Type clrType, SqlConnection sqlConn, bool dryRun, ApplicationDbContext pgDb)
    {
        var ct = CancellationToken.None;

        // Get columns that exist in the MSSQL table
        var mssqlCols = await GetMssqlColumnsAsync(tableName, sqlConn, ct);
        if (mssqlCols.Count == 0) return 0;

        // Get EF model properties for this entity
        var entityType = pgDb.Model.FindEntityType(clrType)!;
        var props = entityType.GetProperties()
            .Select(p => new
            {
                EfProp = p,
                ColName = p.GetColumnName(),
                PropInfo = p.PropertyInfo,
            })
            .Where(x => x.ColName != null && x.PropInfo != null && x.PropInfo.CanWrite
                        && mssqlCols.Contains(x.ColName, StringComparer.OrdinalIgnoreCase))
            .ToList();

        if (props.Count == 0) return 0;

        if (!dryRun)
        {
            // Open connection explicitly (bypasses retry strategy) then set replica mode for this session
            await pgDb.Database.OpenConnectionAsync(ct);
            var pgConn = pgDb.Database.GetDbConnection();
            await using var setCmd = pgConn.CreateCommand();
            setCmd.CommandText = "SET session_replication_role = replica;";
            await setCmd.ExecuteNonQueryAsync(ct);
        }

        try
        {
            var colList = string.Join(", ", props.Select(p => $"[{p.ColName}]"));
            var sql = $"SELECT {colList} FROM [{tableName}] WITH (NOLOCK)";

            int count = 0;
            var batch = new List<object>();

            using var cmd = new SqlCommand(sql, sqlConn) { CommandTimeout = 600 };
            using var reader = await cmd.ExecuteReaderAsync(ct);

            while (await reader.ReadAsync(ct))
            {
                var entity = Activator.CreateInstance(clrType)!;

                foreach (var p in props)
                {
                    try
                    {
                        var ordinal = reader.GetOrdinal(p.ColName!);
                        if (reader.IsDBNull(ordinal)) { p.PropInfo!.SetValue(entity, null); continue; }

                        var rawVal = reader.GetValue(ordinal);
                        var targetType = Nullable.GetUnderlyingType(p.PropInfo!.PropertyType) ?? p.PropInfo.PropertyType;
                        p.PropInfo.SetValue(entity, CoerceValue(rawVal, targetType));
                    }
                    catch { /* skip un-mappable column */ }
                }

                batch.Add(entity);
                count++;

                if (batch.Count >= 500)
                {
                    if (!dryRun) await FlushBatch(batch, pgDb);
                    else batch.Clear();
                }
            }

            if (!dryRun && batch.Count > 0)
                await FlushBatch(batch, pgDb);

            return count;
        }
        finally
        {
            if (!dryRun)
                await pgDb.Database.CloseConnectionAsync();
        }
    }

    private static async Task FlushBatch(List<object> batch, ApplicationDbContext pgDb)
    {
        pgDb.AddRange(batch);
        await pgDb.SaveChangesAsync(CancellationToken.None);
        pgDb.ChangeTracker.Clear();
        batch.Clear();
    }

    private static async Task<HashSet<string>> GetMssqlColumnsAsync(
        string tableName, SqlConnection conn, CancellationToken ct)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var sql = $"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{tableName}'";
        using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 30 };
        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
            set.Add(reader.GetString(0));
        return set;
    }

    private static object? CoerceValue(object raw, Type target)
    {
        if (raw is DBNull) return null;

        // bit (SQL Server stores as bool in ADO.NET) → bool
        if (target == typeof(bool))
            return raw is bool b ? b : Convert.ToBoolean(raw);

        // Guid
        if (target == typeof(Guid))
            return raw is Guid g ? g : Guid.Parse(raw.ToString()!);

        // Enums
        if (target.IsEnum)
            return Enum.ToObject(target, Convert.ToInt32(raw));

        // DateTime → ensure UTC kind for PostgreSQL timestamptz
        if (target == typeof(DateTime) && raw is DateTime dt)
            return dt.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
                : dt.ToUniversalTime();

        if (target == typeof(DateTimeOffset) && raw is DateTime dt2)
            return new DateTimeOffset(DateTime.SpecifyKind(dt2, DateTimeKind.Utc));

        return Convert.ChangeType(raw, target);
    }

    private static string MaskConn(string conn)
    {
        return System.Text.RegularExpressions.Regex.Replace(
            conn, @"(Password|Pwd)=([^;]+)", "$1=***",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }
}
