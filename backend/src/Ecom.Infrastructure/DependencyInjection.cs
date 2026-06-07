using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin;
using Ecom.Infrastructure.Jobs;
using Ecom.Infrastructure.Messaging;
using Ecom.Infrastructure.Messaging.Consumers;
using Ecom.Infrastructure.Messaging.Sagas;
using Ecom.Infrastructure.Persistence;
using Ecom.Infrastructure.Services;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connStr = configuration.GetConnectionString("DefaultConnection") ?? "";
        var dbProvider = configuration["Database:Provider"] ?? "SqlServer";
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (dbProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
                options.UseNpgsql(connStr);
            else
                options.UseSqlServer(connStr);
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IStockService, StockService>();
        var iyzicoApiKey = configuration["Iyzico:ApiKey"];
        if (!string.IsNullOrWhiteSpace(iyzicoApiKey))
        {
            services.AddHttpClient<IyzicoPaymentService>();
            services.AddScoped<IPaymentService, IyzicoPaymentService>();
        }
        else
        {
            services.AddScoped<IPaymentService, MockPaymentService>();
        }
        services.AddScoped<IInvoiceService, MockInvoiceService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddHttpClient<ITelegramService, TelegramService>();
        services.AddHttpClient<IGeoIpService, GeoIpService>();
        services.AddHttpClient();
        services.AddHttpClient("github", c =>
        {
            c.BaseAddress = new Uri("https://api.github.com/");
            c.DefaultRequestHeaders.Add("User-Agent", "Ecom-Admin/1.0");
            c.DefaultRequestHeaders.Add("Accept", "application/vnd.github+json");
            c.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
            c.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddScoped<IExternalSourceFetcher, ExternalSourceFetcher>();
        services.AddHostedService<ScheduledSourceFetchService>();
        services.AddHttpContextAccessor();
        services.AddScoped<IEventPublisher, OutboxEventPublisher>();
        services.AddScoped<ImportBatchProcessor>();
        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<ILicenseService, LicenseService>();

        // Licence service HTTP client — forwards admin license operations to dotnet-ecom-licence
        var licenceBaseUrl = configuration["LicenceService:BaseUrl"];
        services.AddHttpClient("EcomLicence", c =>
        {
            if (!string.IsNullOrWhiteSpace(licenceBaseUrl))
            {
                c.BaseAddress = new Uri(licenceBaseUrl.TrimEnd('/') + "/");
                c.Timeout = TimeSpan.FromSeconds(15);
            }
        });
        services.AddScoped<ILicenceServiceClient, LicenceServiceClient>();
        services.AddScoped<IDapperQueryService, DapperQueryService>();
        services.AddSingleton<IServiceStateManager, ServiceStateManager>();
        services.AddSingleton<IDeployStreamHub, DeployStreamHub>();
        services.AddScoped<IDeployService, DeployService>();
        services.AddScoped<ITotpService, TotpService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        services.AddDataProtection();

        var redisConn = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConn))
            services.AddStackExchangeRedisCache(o => o.Configuration = redisConn);
        else
            services.AddDistributedMemoryCache();

        var rabbitHost = configuration["RabbitMQ:Host"];
        services.AddMassTransit(x =>
        {
            x.AddConsumer<OrderCreatedConsumer>();
            x.AddConsumer<PaymentCompletedConsumer>();
            x.AddConsumer<OrderStatusChangedConsumer>();
            x.AddConsumer<ImportJobConsumer>();

            x.AddSagaStateMachine<OrderProcessingStateMachine, Ecom.Infrastructure.Messaging.Sagas.OrderSagaState>()
                .EntityFrameworkRepository(r =>
                {
                    r.ExistingDbContext<ApplicationDbContext>();
                });

            if (!string.IsNullOrWhiteSpace(rabbitHost))
            {
                x.UsingRabbitMq((ctx, cfg) =>
                {
                    cfg.Host(rabbitHost, h =>
                    {
                        h.Username(configuration["RabbitMQ:Username"] ?? "guest");
                        h.Password(configuration["RabbitMQ:Password"] ?? "guest");
                    });
                    cfg.ConfigureEndpoints(ctx);
                });
            }
            else
            {
                x.UsingInMemory((ctx, cfg) => cfg.ConfigureEndpoints(ctx));
            }
        });

        services.AddHostedService<OutboxProcessor>();

        // Background jobs
        services.AddSingleton<IJobStreamHub, JobStreamHub>();
        services.AddSingleton<IJobRunner, DocsRefreshJob>();
        services.AddSingleton<IJobRunner, TestSyncJob>();
        services.AddSingleton<IJobRunner, SystemHealthJob>();
        services.AddSingleton<IJobRunner, QueueMonitorJob>();
        services.AddSingleton<IJobRunner, FrontendHealthJob>();
        services.AddSingleton<IJobRunner, StockAlertJob>();
        services.AddSingleton<IJobRunner, OutboxRetryJob>();
        services.AddSingleton<IJobRunner, SessionCleanupJob>();
        services.AddSingleton<IJobRunner, TokenCleanupJob>();
        services.AddSingleton<IJobRunner, ErrorLogRetentionJob>();
        services.AddSingleton<IJobRunner, AuditLogRetentionJob>();
        services.AddSingleton<IJobRunner, VisitorLogRetentionJob>();
        services.AddSingleton<IJobRunner, ChangelogDocsJob>();
        services.AddSingleton<IJobRunner, WorkNotesDocsJob>();
        services.AddSingleton<IJobRunner, BusinessProcessDocsJob>();
        services.AddSingleton<IJobRunner, TechAnalysisDocsJob>();
        services.AddSingleton<IJobRunner, ModuleHealthCheckJob>();
        services.AddSingleton<IJobRunner, TodoVerificationJob>();
        services.AddSingleton<JobScheduler>();
        services.AddHostedService(sp => sp.GetRequiredService<JobScheduler>());

        return services;
    }
}
