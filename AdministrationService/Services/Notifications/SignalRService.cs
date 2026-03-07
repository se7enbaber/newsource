using System.Text;
using System.Text.Json;

namespace AdministrationService.Services.Notifications
{
    /// <summary>
    /// Interface để gửi thông báo real-time qua SignalR Service (microservice riêng biệt).
    /// Implementation sẽ gọi HTTP POST sang SignalRService thay vì dùng IHubContext trực tiếp.
    /// </summary>
    public interface ISignalRService
    {
        Task SendNotificationAsync(Guid tenantId, string title, string message, string type = "info");
        Task SendJobStatusAsync(Guid tenantId, string jobId, string status, string message);
    }

    /// <summary>
    /// HTTP Client wrapper — gọi sang SignalRService API để broadcast thông báo.
    /// Đây là cách AdministrationService (và Hangfire jobs) giao tiếp với SignalRService.
    /// </summary>
    public class SignalRHttpClient : ISignalRService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<SignalRHttpClient> _logger;
        private readonly IConfiguration _configuration;

        public SignalRHttpClient(
            IHttpClientFactory httpClientFactory,
            ILogger<SignalRHttpClient> logger,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _configuration = configuration;
        }

        private string SignalRServiceBaseUrl =>
            _configuration["SignalRService:BaseUrl"] ?? "http://localhost:5063";

        public async Task SendNotificationAsync(Guid tenantId, string title, string message, string type = "info")
        {
            try
            {
                var client = _httpClientFactory.CreateClient("SignalRService");
                var payload = new { tenantId, title, message, type };
                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                var response = await client.PostAsync($"{SignalRServiceBaseUrl}/api/notifications", content);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("SignalRService returned {StatusCode} when sending notification", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                // Không throw để tránh làm hỏng business logic nếu SignalRService không chạy
                _logger.LogWarning(ex, "Failed to send notification via SignalRService. Skipping.");
            }
        }

        public async Task SendJobStatusAsync(Guid tenantId, string jobId, string status, string message)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("SignalRService");
                var payload = new { tenantId, jobId, status, message };
                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                var response = await client.PostAsync($"{SignalRServiceBaseUrl}/api/notifications/job-status", content);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("SignalRService returned {StatusCode} when sending job status", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send job status via SignalRService. Skipping.");
            }
        }
    }
}
