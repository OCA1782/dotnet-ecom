using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

// Private key: ECOM_LICENSE_PRIVATE_KEY env var veya argüman olarak alınır
var privateKeyB64 = Environment.GetEnvironmentVariable("ECOM_LICENSE_PRIVATE_KEY")
    ?? (args.Length > 0 ? args[0] : null);

if (string.IsNullOrWhiteSpace(privateKeyB64))
{
    Console.Error.WriteLine("Kullanım: ecom-license <private_key_base64>");
    Console.Error.WriteLine("   veya:  ECOM_LICENSE_PRIVATE_KEY=<key> ecom-license");
    Console.Error.WriteLine("");
    Console.Error.WriteLine("Parametreler (isteğe bağlı, stdin'den okunur):");
    Console.Error.WriteLine("  issuer    : lisansı alan kişi/kurum (varsayılan: OCA1782)");
    Console.Error.WriteLine("  notBefore : geçerlilik başlangıcı  (varsayılan: bugün)");
    Console.Error.WriteLine("  expiresAt : son geçerlilik tarihi  (varsayılan: 2 yıl sonra)");
    Environment.Exit(1);
}

// Parametreler
Console.Write("Issuer (Enter = OCA1782): ");
var issuer = Console.ReadLine()?.Trim();
if (string.IsNullOrEmpty(issuer)) issuer = "OCA1782";

Console.Write($"NotBefore (Enter = {DateTime.UtcNow:yyyy-MM-dd}): ");
var nbfInput = Console.ReadLine()?.Trim();
var nbf = string.IsNullOrEmpty(nbfInput) ? DateTime.UtcNow : DateTime.Parse(nbfInput);

Console.Write($"ExpiresAt (Enter = {DateTime.UtcNow.AddYears(2):yyyy-MM-dd}): ");
var expInput = Console.ReadLine()?.Trim();
var exp = string.IsNullOrEmpty(expInput) ? DateTime.UtcNow.AddYears(2) : DateTime.Parse(expInput);

// Payload oluştur
var payload = JsonSerializer.Serialize(new
{
    app = "Ecom",
    iss = issuer,
    nbf = nbf.ToString("yyyy-MM-dd"),
    exp = exp.ToString("yyyy-MM-dd")
}, new JsonSerializerOptions { WriteIndented = false });

var payloadBytes = Encoding.UTF8.GetBytes(payload);

// RSA imzala
using var rsa = RSA.Create();
rsa.ImportPkcs8PrivateKey(Convert.FromBase64String(privateKeyB64), out _);

var signatureBytes = rsa.SignData(payloadBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

// base64url encode
static string ToBase64Url(byte[] data)
{
    return Convert.ToBase64String(data)
        .TrimEnd('=')
        .Replace('+', '-')
        .Replace('/', '_');
}

var token = $"{ToBase64Url(payloadBytes)}.{ToBase64Url(signatureBytes)}";

Console.WriteLine("");
Console.WriteLine("=== LİSANS TOKEN ===");
Console.WriteLine(token);
Console.WriteLine("====================");
Console.WriteLine($"Payload : {payload}");
Console.WriteLine($"Süre    : {nbf:yyyy-MM-dd} → {exp:yyyy-MM-dd}");
