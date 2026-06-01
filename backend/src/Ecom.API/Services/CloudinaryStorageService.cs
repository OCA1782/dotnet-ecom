using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Ecom.API.Services;

public class CloudinaryStorageService(Cloudinary cloudinary) : IStorageService
{
    private static readonly string[] VideoTypes = ["video/mp4", "video/webm", "video/ogg"];

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        var publicId = $"ecom/{Path.GetFileNameWithoutExtension(fileName)}";

        if (VideoTypes.Contains(contentType))
        {
            var p = new VideoUploadParams
            {
                File = new FileDescription(fileName, stream),
                PublicId = publicId,
            };
            var r = await cloudinary.UploadAsync(p);
            if (r.Error != null) throw new InvalidOperationException(r.Error.Message);
            return r.SecureUrl.ToString();
        }
        else
        {
            var p = new ImageUploadParams
            {
                File = new FileDescription(fileName, stream),
                PublicId = publicId,
                Transformation = new Transformation().Quality("auto").FetchFormat("auto"),
            };
            var r = await cloudinary.UploadAsync(p);
            if (r.Error != null) throw new InvalidOperationException(r.Error.Message);
            return r.SecureUrl.ToString();
        }
    }
}
