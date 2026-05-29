using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/system-info")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SystemInfoController(IConfiguration configuration, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var dbProvider = configuration["Database:Provider"] ?? "SqlServer";
        var connStr = configuration.GetConnectionString("DefaultConnection") ?? "";
        var redisConn = configuration.GetConnectionString("Redis");
        var rmqHost = configuration["RabbitMQ:Host"];
        var smtpHost = configuration["Email:SmtpHost"];
        var smtpPort = configuration["Email:SmtpPort"] ?? "587";
        var jwtIssuer = configuration["Jwt:Issuer"];
        var jwtExpire = configuration["Jwt:ExpireMinutes"] ?? "60";

        return Ok(new
        {
            Environment = env.EnvironmentName,
            AppVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0",
            Database = new
            {
                Provider = dbProvider,
                ConnectionMasked = MaskConnectionString(connStr),
                IsConfigured = !string.IsNullOrWhiteSpace(connStr),
            },
            Cache = new
            {
                Provider = !string.IsNullOrWhiteSpace(redisConn) ? "Redis" : "InMemory",
                ConnectionMasked = !string.IsNullOrWhiteSpace(redisConn) ? MaskRedis(redisConn) : null,
                IsConfigured = !string.IsNullOrWhiteSpace(redisConn),
            },
            Queue = new
            {
                Provider = !string.IsNullOrWhiteSpace(rmqHost) ? "RabbitMQ" : "InMemory",
                Host = rmqHost ?? "localhost (InMemory)",
                Port = configuration["RabbitMQ:Port"] ?? "5672",
                VirtualHost = configuration["RabbitMQ:VirtualHost"] ?? "/",
                IsConfigured = !string.IsNullOrWhiteSpace(rmqHost),
            },
            Email = new
            {
                SmtpHost = smtpHost ?? "(yapılandırılmamış)",
                SmtpPort = smtpPort,
                SenderEmail = configuration["Email:SenderEmail"],
                IsConfigured = !string.IsNullOrWhiteSpace(smtpHost),
            },
            Auth = new
            {
                JwtIssuer = jwtIssuer,
                JwtExpireMinutes = jwtExpire,
            },
            Runtime = new
            {
                DotNetVersion = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
                OsDescription = System.Runtime.InteropServices.RuntimeInformation.OSDescription,
                MachineName = System.Environment.MachineName,
                ProcessorCount = System.Environment.ProcessorCount,
            }
        });
    }

    private static string MaskConnectionString(string conn)
    {
        if (string.IsNullOrWhiteSpace(conn)) return "(boş)";
        // mask password
        var result = System.Text.RegularExpressions.Regex.Replace(
            conn, @"(Password|Pwd)=([^;]+)", "$1=***", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        // truncate if too long
        return result.Length > 80 ? result[..80] + "…" : result;
    }

    private static string MaskRedis(string conn)
    {
        if (string.IsNullOrWhiteSpace(conn)) return "(boş)";
        return conn.Length > 40 ? conn[..40] + "…" : conn;
    }
}
