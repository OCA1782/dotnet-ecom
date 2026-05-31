using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Caching.Memory;

namespace Ecom.Infrastructure.Jobs;

public class TestSyncJob(
    IActionDescriptorCollectionProvider actionProvider,
    IMemoryCache cache) : IJobRunner
{
    public string Name => "TestSyncJob";
    public string Description => "Admin > Testler — endpoint listesini kodla senkronize eder";
    public int IntervalMinutes => 5;

    public const string CacheKey = "jobs:test-definitions";

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("Controller/action listesi taranıyor...");

        var actions = actionProvider.ActionDescriptors.Items
            .OfType<ControllerActionDescriptor>()
            .Select(a => new
            {
                Controller = a.ControllerName,
                Action = a.ActionName,
                Route = a.AttributeRouteInfo?.Template ?? $"{a.ControllerName}/{a.ActionName}",
                HttpMethod = a.EndpointMetadata
                    .OfType<Microsoft.AspNetCore.Routing.HttpMethodMetadata>()
                    .SelectMany(m => m.HttpMethods)
                    .FirstOrDefault() ?? "GET"
            })
            .OrderBy(a => a.Controller)
            .ThenBy(a => a.Action)
            .ToList();

        var grouped = actions
            .GroupBy(a => a.Controller)
            .Select(g => new
            {
                Controller = g.Key,
                Endpoints = g.Select(a => new
                {
                    a.Action,
                    a.HttpMethod,
                    a.Route,
                    TestName = $"{a.HttpMethod} /{a.Route}"
                }).ToList()
            })
            .ToList();

        cache.Set(CacheKey, grouped, TimeSpan.FromMinutes(10));

        await log($"  ✓ {actions.Count} endpoint, {grouped.Count} controller tarandı");
        await log($"  Cache güncellendi ({CacheKey})");
        await log("Admin > Testler > API Tarama sekmesi bir sonraki yüklemede güncel listeyi gösterecek.");
    }
}
