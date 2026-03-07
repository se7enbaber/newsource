using Minio;
using Minio.DataModel.Args;
using ShareService.Storage;

namespace FileService.Services;

/// <summary>
/// Implement IFileStorageService dùng MinIO (S3-compatible)
/// Mỗi Tenant có bucket riêng — đảm bảo cô lập dữ liệu multi-tenant
/// </summary>
public class MinioFileStorageService : IFileStorageService
{
    private readonly IMinioClient _minio;
    private readonly ILogger<MinioFileStorageService> _logger;
    private readonly IConfiguration _config;

    public MinioFileStorageService(
        IMinioClient minio,
        ILogger<MinioFileStorageService> logger,
        IConfiguration config)
    {
        _minio  = minio;
        _logger = logger;
        _config = config;
    }

    // Tên bucket theo TenantId — cô lập hoàn toàn dữ liệu
    private static string GetBucketName(string tenantId)
        => $"tenant-{tenantId.ToLowerInvariant()}";

    // Object name = folder/fileName
    private static string GetObjectName(string folder, string fileName)
        => $"{folder.Trim('/')}/{fileName}";

    public async Task<FileUploadResult> UploadAsync(
        string tenantId, string folder, string fileName,
        Stream fileStream, string contentType,
        CancellationToken ct = default)
    {
        var bucket     = GetBucketName(tenantId);
        var objectName = GetObjectName(folder, fileName);

        try
        {
            // Tạo bucket nếu chưa có
            var bucketExists = await _minio.BucketExistsAsync(
                new BucketExistsArgs().WithBucket(bucket), ct);

            if (!bucketExists)
            {
                await _minio.MakeBucketAsync(
                    new MakeBucketArgs().WithBucket(bucket), ct);
                _logger.LogInformation("Created bucket {Bucket} for tenant {TenantId}", 
                    bucket, tenantId);
            }

            // Upload file
            await _minio.PutObjectAsync(new PutObjectArgs()
                .WithBucket(bucket)
                .WithObject(objectName)
                .WithStreamData(fileStream)
                .WithObjectSize(fileStream.Length)
                .WithContentType(contentType), ct);

            var url = await GetPresignedUrlAsync(tenantId, folder, fileName, 
                _config.GetValue<int>("MinIO:DefaultExpiry", 60), ct);

            _logger.LogInformation(
                "Uploaded file {FileName} to bucket {Bucket}, folder {Folder}",
                fileName, bucket, folder);

            return new FileUploadResult
            {
                Success     = true,
                FileName    = fileName,
                Url         = url,
                BucketName  = bucket,
                SizeBytes   = fileStream.Length,
                ContentType = contentType
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Failed to upload file {FileName} for tenant {TenantId}", 
                fileName, tenantId);

            return new FileUploadResult
            {
                Success      = false,
                FileName     = fileName,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<string> GetPresignedUrlAsync(
        string tenantId, string folder, string fileName,
        int expiryMinutes = 60, CancellationToken ct = default)
    {
        var bucket     = GetBucketName(tenantId);
        var objectName = GetObjectName(folder, fileName);

        return await _minio.PresignedGetObjectAsync(new PresignedGetObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectName)
            .WithExpiry(expiryMinutes * 60));
    }

    public async Task<Stream?> DownloadAsync(
        string tenantId, string folder, string fileName,
        CancellationToken ct = default)
    {
        try
        {
            var bucket = GetBucketName(tenantId);
            var objectName = GetObjectName(folder, fileName);

            var ms = new MemoryStream();
            await _minio.GetObjectAsync(new GetObjectArgs()
                .WithBucket(bucket)
                .WithObject(objectName)
                .WithCallbackStream((stream) => stream.CopyTo(ms)), ct);

            ms.Position = 0;
            return ms;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download file {FileName} for tenant {TenantId}", fileName, tenantId);
            return null;
        }
    }

    public async Task<bool> DeleteAsync(
        string tenantId, string folder, string fileName,
        CancellationToken ct = default)
    {
        try
        {
            var bucket     = GetBucketName(tenantId);
            var objectName = GetObjectName(folder, fileName);

            await _minio.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(bucket)
                .WithObject(objectName), ct);

            _logger.LogInformation(
                "Deleted file {FileName} from bucket {Bucket}", fileName, bucket);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Failed to delete file {FileName} for tenant {TenantId}", 
                fileName, tenantId);
            return false;
        }
    }

    public async Task<IEnumerable<string>> ListAsync(
        string tenantId, string folder, CancellationToken ct = default)
    {
        var bucket = GetBucketName(tenantId);
        var prefix = $"{folder.Trim('/')}/";
        var files  = new List<string>();

        var args = new ListObjectsArgs()
            .WithBucket(bucket)
            .WithPrefix(prefix)
            .WithRecursive(false);

        await foreach (var item in _minio.ListObjectsEnumAsync(args, ct))
            files.Add(item.Key);

        return files;
    }
}
