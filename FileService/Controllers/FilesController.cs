using Microsoft.AspNetCore.Mvc;
using ShareService.Storage;

namespace FileService.Controllers;

[ApiController]
[Route("api/files")]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _storage;
    private readonly ILogger<FilesController> _logger;
    private readonly IConfiguration _config;

    // Các folder hợp lệ — tránh path traversal
    private static readonly HashSet<string> AllowedFolders =
        new(StringComparer.OrdinalIgnoreCase)
        { "avatars", "documents", "logos", "reports", "attachments" };

    public FilesController(
        IFileStorageService storage,
        ILogger<FilesController> logger,
        IConfiguration config)
    {
        _storage = storage;
        _logger  = logger;
        _config  = config;
    }

    /// <summary>Upload file — TenantId lấy từ header X-Tenant-Id</summary>
    [HttpPost("{folder}/upload")]
    public async Task<IActionResult> Upload(
        string folder, IFormFile file,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            return BadRequest(new { message = "Header X-Tenant-Id là bắt buộc" });

        if (!AllowedFolders.Contains(folder))
            return BadRequest(new { message = $"Folder không hợp lệ. Cho phép: {string.Join(", ", AllowedFolders)}" });

        // Validate file size
        var maxSize = _config.GetValue<long>("MaxFileSizeBytes", 52428800);
        if (file.Length > maxSize)
            return BadRequest(new { message = $"File vượt quá kích thước tối đa {maxSize / 1024 / 1024}MB" });

        // Validate extension
        var allowedExt = _config.GetValue<string>("AllowedExtensions", "")!
            .Split(',', StringSplitOptions.RemoveEmptyEntries);
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExt.Contains(ext))
            return BadRequest(new { message = $"Định dạng file không được hỗ trợ: {ext}" });

        // Tạo tên file unique tránh trùng
        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";

        await using var stream = file.OpenReadStream();
        var result = await _storage.UploadAsync(
            tenantId, folder, uniqueFileName,
            stream, file.ContentType, ct);

        if (!result.Success)
        {
            _logger.LogError("Upload failed: {Error}", result.ErrorMessage);
            return StatusCode(500, new { message = "Upload thất bại", detail = result.ErrorMessage });
        }

        return Ok(result);
    }

    /// <summary>Lấy URL download có thời hạn</summary>
    [HttpGet("{folder}/{fileName}/url")]
    public async Task<IActionResult> GetUrl(
        string folder, string fileName,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        [FromQuery] int expiryMinutes = 60,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            return BadRequest(new { message = "Header X-Tenant-Id là bắt buộc" });

        var url = await _storage.GetPresignedUrlAsync(
            tenantId, folder, fileName, expiryMinutes, ct);

        return Ok(new { url });
    }

    /// <summary>Xem trực tiếp file (trả về stream)</summary>
    [HttpGet("{folder}/{fileName}/view")]
    public async Task<IActionResult> View(
        string folder, string fileName,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            return BadRequest(new { message = "Header X-Tenant-Id là bắt buộc" });

        var stream = await _storage.DownloadAsync(tenantId, folder, fileName, ct);
        if (stream == null) return NotFound();

        // Get content type (simple logic)
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var contentType = ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };

        return File(stream, contentType);
    }

    /// <summary>Liệt kê file trong folder</summary>
    [HttpGet("{folder}")]
    public async Task<IActionResult> List(
        string folder,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            return BadRequest(new { message = "Header X-Tenant-Id là bắt buộc" });

        var files = await _storage.ListAsync(tenantId, folder, ct);
        return Ok(files);
    }

    /// <summary>Xóa file</summary>
    [HttpDelete("{folder}/{fileName}")]
    public async Task<IActionResult> Delete(
        string folder, string fileName,
        [FromHeader(Name = "X-Tenant-Id")] string tenantId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            return BadRequest(new { message = "Header X-Tenant-Id là bắt buộc" });

        var success = await _storage.DeleteAsync(tenantId, folder, fileName, ct);
        return success ? Ok(new { message = "Xóa thành công" })
                       : StatusCode(500, new { message = "Xóa thất bại" });
    }

    /// <summary>Health check nội bộ</summary>
    [HttpGet("/health")]
    public IActionResult Health() => Ok(new { status = "Healthy", service = "FileService" });
}
