using Ecom.Application.Common.Interfaces;
using Ecom.Infrastructure.Persistence;
using Ecom.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

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
        services.AddScoped<IEmailService, EmailService>();
        services.AddHttpClient<ITelegramService, TelegramService>();
        services.AddHttpContextAccessor();

        return services;
    }
}
