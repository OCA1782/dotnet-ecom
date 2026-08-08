using Amazon.S3;
using Amazon.S3.Model;

namespace Ecom.API.Services;

public class R2StorageService(IAmazonS3 s3, IConfiguration configuration) : IStorageService
{
    private readonly string _bucket    = configuration["R2:Bucket"]    ?? throw new InvalidOperationException("R2:Bucket yapılandırılmamış");
    private readonly string _publicUrl = configuration["R2:PublicUrl"] ?? throw new InvalidOperationException("R2:PublicUrl yapılandırılmamış");

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = MimeToExt(contentType);

        var key = $"products/{Guid.NewGuid():N}{ext}";

        // Buffer stream so content length is known — R2 rejects chunked streaming uploads
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms, ct);
        ms.Position = 0;

        await s3.PutObjectAsync(new PutObjectRequest
        {
            BucketName  = _bucket,
            Key         = key,
            InputStream = ms,
            ContentType = contentType,
            DisablePayloadSigning = true, // R2 does not support STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER
            Headers     = { CacheControl = "public, max-age=31536000, immutable" }
        }, ct);

        return $"{_publicUrl.TrimEnd('/')}/{key}";
    }

    private static string MimeToExt(string mime) => mime switch
    {
        "image/jpeg" => ".jpg",
        "image/png"  => ".png",
        "image/webp" => ".webp",
        "image/gif"  => ".gif",
        "image/avif" => ".avif",
        _            => ".jpg",
    };
}
