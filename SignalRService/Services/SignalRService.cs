using Microsoft.AspNetCore.SignalR;
using SignalRService.Infrastructure;
using SignalRService.Hubs;


namespace SignalRService.Services
{
    public interface ISignalRService
    {
        Task SendNotificationAsync(Guid? tenantId, string title, string message, string type = "info");
        Task SendJobStatusAsync(Guid? tenantId, string jobId, string status, string message);
    }

    public class SignalRService : ISignalRService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public SignalRService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendNotificationAsync(Guid? tenantId, string title, string message, string type = "info")
        {
            var finalType = string.IsNullOrEmpty(type) ? "info" : type.ToLower();
            var data = new NotificationDto(title, message, finalType);

            if (tenantId.HasValue)
            {
                var groupName = tenantId.Value.ToString().ToLower();
                await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", data);
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", data);
            }
        }


        public async Task SendJobStatusAsync(Guid? tenantId, string jobId, string status, string message)
        {
            var data = new JobStatusDto(jobId, status, message, DateTime.UtcNow);
            if (tenantId.HasValue)
            {
                var groupName = tenantId.Value.ToString().ToLower();
                await _hubContext.Clients.Group(groupName).SendAsync("ReceiveJobStatus", data);
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("ReceiveJobStatus", data);
            }
        }

    }
}
