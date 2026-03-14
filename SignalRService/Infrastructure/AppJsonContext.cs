using System.Text.Json.Serialization;

namespace SignalRService.Infrastructure;

[JsonSerializable(typeof(NotificationDto))]
[JsonSerializable(typeof(JobStatusDto))]
[JsonSerializable(typeof(List<string>))]
internal partial class AppJsonContext : JsonSerializerContext
{
}

public record NotificationDto(string title, string message, string type);
public record JobStatusDto(string jobId, string status, string message, DateTime timestamp);
