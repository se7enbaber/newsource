using System.Text.Json.Serialization;
using ShareService.Storage;

namespace FileService.Infrastructure;

[JsonSerializable(typeof(FileUploadResult))]
[JsonSerializable(typeof(List<string>))]
[JsonSerializable(typeof(ErrorMessageDto))]
[JsonSerializable(typeof(UrlResultDto))]
internal partial class AppJsonContext : JsonSerializerContext
{
}

public record ErrorMessageDto(string message, string? detail = null);
public record UrlResultDto(string url);
