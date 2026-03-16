using System.Text.Json.Serialization;
using System.Collections.Generic;
using System.Collections.Concurrent;

namespace SignalRService.Infrastructure;

[JsonSerializable(typeof(NotificationDto))]
[JsonSerializable(typeof(JobStatusDto))]
[JsonSerializable(typeof(List<string>))]
[JsonSerializable(typeof(Dictionary<string, string>))]
[JsonSerializable(typeof(List<SlowLogDto>))]
[JsonSerializable(typeof(SlowLogDto))]
[JsonSerializable(typeof(ConcurrentDictionary<string, ServiceHealthDto>))]
[JsonSerializable(typeof(ServiceHealthDto))]
[JsonSerializable(typeof(SignalRService.Controllers.NotificationRequest))]
[JsonSerializable(typeof(SignalRService.Controllers.JobStatusRequest))]
internal partial class AppJsonContext : JsonSerializerContext
{
}

public record NotificationDto(string title, string message, string type);
public record JobStatusDto(string jobId, string status, string message, DateTime timestamp);
public record SlowLogDto(string Id, DateTime Time, double DurationMs, string Command);
public record ServiceHealthDto(string Status, string Message, int Code);
