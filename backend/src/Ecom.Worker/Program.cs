using Ecom.Application.Common.Interfaces;
using Ecom.Infrastructure.Jobs;
using Ecom.Infrastructure.Persistence;
using Ecom.Infrastructure.Services;
using Ecom.Worker;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File("logs/worker-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14)
    .CreateLogger();

try
{
    Log.Information("Ecom.Worker başlatılıyor...");

    var builder = Host.CreateApplicationBuilder(args);

    // Windows Service support — runs as a Windows Service when installed
    builder.Services.AddWindowsService(options => options.ServiceName = "Ecom.Worker");
    builder.Logging.ClearProviders();
    builder.Services.AddSerilog();

    var configuration = builder.Configuration;
    var connStr = configuration.GetConnectionString("DefaultConnection") ?? "";
    var dbProvider = configuration["Database:Provider"] ?? "SqlServer";

    // EF Core
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
        if (dbProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
            options.UseNpgsql(connStr);
        else
            options.UseSqlServer(connStr);
    });
    builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

    // Memory cache (used by changelog / docs jobs)
    builder.Services.AddMemoryCache();

    // IWebHostEnvironment adapter (jobs depend on it for ContentRootPath)
    builder.Services.AddSingleton<IWebHostEnvironment>(sp =>
        new WebHostEnvAdapter(sp.GetRequiredService<IHostEnvironment>()));

    // Job infrastructure
    builder.Services.AddSingleton<IJobStreamHub, NullJobStreamHub>();
    builder.Services.AddSingleton<IServiceStateManager, ServiceStateManager>();

    // Register only the doc-related jobs (these are the ones that need standalone scheduling)
    builder.Services.AddSingleton<IJobRunner, ChangelogDocsJob>();
    builder.Services.AddSingleton<IJobRunner, WorkNotesDocsJob>();

    // The job scheduler BackgroundService
    builder.Services.AddSingleton<JobScheduler>();
    builder.Services.AddHostedService(sp => sp.GetRequiredService<JobScheduler>());

    var host = builder.Build();
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Ecom.Worker beklenmedik hatayla kapandı");
}
finally
{
    Log.CloseAndFlush();
}
