using Microsoft.AspNetCore.Mvc;
using SignalRService.Services;

namespace SignalRService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly ISignalRService _signalRService;

        public NotificationsController(ISignalRService signalRService)
        {
            _signalRService = signalRService;
        }

        [HttpPost]
        public async Task<IActionResult> SendNotification([FromBody] NotificationRequest request)
        {
            await _signalRService.SendNotificationAsync(request.TenantId, request.Title, request.Message, request.Type);
            return Ok();
        }

        [HttpPost("job-status")]
        public async Task<IActionResult> SendJobStatus([FromBody] JobStatusRequest request)
        {
            await _signalRService.SendJobStatusAsync(request.TenantId, request.JobId, request.Status, request.Message);
            return Ok();
        }
    }

    public class NotificationRequest
    {
        [System.Text.Json.Serialization.JsonPropertyName("tenantId")]
        public Guid? TenantId { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("title")]
        public string Title { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("message")]
        public string Message { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("type")]
        public string Type { get; set; }
    }

    public class JobStatusRequest
    {
        [System.Text.Json.Serialization.JsonPropertyName("tenantId")]
        public Guid? TenantId { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("jobId")]
        public string JobId { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("status")]
        public string Status { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("message")]
        public string Message { get; set; }
    }
}
