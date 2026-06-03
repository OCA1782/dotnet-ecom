using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

namespace Ecom.Worker;

// Provides IWebHostEnvironment in a non-web (Worker) host context.
// Only ContentRootPath is used by the jobs; other members have safe defaults.
internal sealed class WebHostEnvAdapter(IHostEnvironment env) : IWebHostEnvironment
{
    public string WebRootPath { get => env.ContentRootPath; set { } }
    public IFileProvider WebRootFileProvider { get => env.ContentRootFileProvider; set { } }
    public string EnvironmentName { get => env.EnvironmentName; set { } }
    public string ApplicationName { get => env.ApplicationName; set { } }
    public string ContentRootPath { get => env.ContentRootPath; set { } }
    public IFileProvider ContentRootFileProvider { get => env.ContentRootFileProvider; set { } }
}
