namespace ShareService.Storage;

/// <summary>
/// Interface dùng chung cho toàn hệ thống — implement tại FileService
/// Các service khác inject qua HTTP client wrapper, không gọi trực tiếp
/// </summary>
public interface IFileStorageService
{
    /// <summary>Upload file, trả về URL public để truy cập</summary>
    Task<FileUploadResult> UploadAsync(
        string tenantId,
        string folder,
        string fileName,
        Stream fileStream,
        string contentType,
        CancellationToken ct = default);

    /// <summary>Lấy URL có thời hạn để download file</summary>
    Task<string> GetPresignedUrlAsync(
        string tenantId,
        string folder,
        string fileName,
        int expiryMinutes = 60,
        CancellationToken ct = default);

    /// <summary>Tải stream file</summary>
    Task<Stream?> DownloadAsync(
        string tenantId,
        string folder,
        string fileName,
        CancellationToken ct = default);

    /// <summary>Xóa file</summary>
    Task<bool> DeleteAsync(
        string tenantId,
        string folder,
        string fileName,
        CancellationToken ct = default);

    /// <summary>Liệt kê file trong folder của tenant</summary>
    Task<IEnumerable<string>> ListAsync(
        string tenantId,
        string folder,
        CancellationToken ct = default);
}
