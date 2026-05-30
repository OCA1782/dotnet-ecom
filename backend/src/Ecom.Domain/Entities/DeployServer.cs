using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class DeployServer : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Environment { get; set; } = "dev"; // dev/staging/prod
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 22;
    public string Username { get; set; } = string.Empty;
    public string AuthType { get; set; } = "password"; // password/sshkey
    public string? EncryptedCredential { get; set; } // AES-encrypted password or SSH key
    public string DeployPath { get; set; } = "/opt/ecom";
    public string ComposeFile { get; set; } = "docker-compose.yml";
    public string? HealthCheckUrl { get; set; }
    public string Branch { get; set; } = "main";
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public int? LastDeployDurationSeconds { get; set; }
    public DateTime? LastDeployAt { get; set; }
    public string? LastDeployStatus { get; set; }

    public ICollection<DeployLog> Logs { get; set; } = new List<DeployLog>();
}
