namespace Ecom.Infrastructure.Security;

// Lisanstan türetilen JWT imzalama anahtarı. DI üzerinden hem JwtService hem
// AddJwtBearer tarafından kullanılır — ikisi de aynı anahtarı görmek zorundadır.
public sealed class LicenseJwtKey(byte[] bytes)
{
    public byte[] Bytes { get; } = bytes;
}
