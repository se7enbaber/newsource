namespace ShareService.Storage;

public class FileUploadResult
{
    public bool Success { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}
