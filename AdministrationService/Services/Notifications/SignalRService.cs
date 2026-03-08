extern alias PollyCore;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration;
using BrokenCircuitException = PollyCore::Polly.CircuitBreaker.BrokenCircuitException;

namespace AdministrationService.Services.Notifications
{
    /// <summary>
    /// Interface để gửi thông báo real-time qua SignalR Service.
    /// </summary>
    public interface ISignalRService
    {
        Task SendNotificationAsync(Guid tenantId, string title, string message, string type = "info");
        Task SendJobStatusAsync(Guid tenantId, string jobId, string status, string message);
    }

    /// <summary>
    /// HTTP Client wrapper với Resilience (Retry, Circuit Breaker, Timeout).
    /// </summary>
    public class SignalRService : ISignalRService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<SignalRService> _logger;

        public SignalRService(
            IHttpClientFactory httpClientFactory,
            ILogger<SignalRService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task SendNotificationAsync(Guid tenantId, string title, string message, string type = "info")
        {
            await ExecuteWithResilienceAsync(async (client) =>
            {
                var payload = new { tenantId, title, message, type };
                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                return await client.PostAsync("api/notifications", content);
            }, "SendNotification");
        }

        public async Task SendJobStatusAsync(Guid tenantId, string jobId, string status, string message)
        {
            await ExecuteWithResilienceAsync(async (client) =>
            {
                var payload = new { tenantId, jobId, status, message };
                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                return await client.PostAsync("api/notifications/job-status", content);
            }, "SendJobStatus");
        }

        /// <summary>
        /// Thực thi request với cơ chế catch BrokenCircuitException để không làm hỏng flow chính (như Hangfire jobs).
        /// </summary>
        private async Task ExecuteWithResilienceAsync(Func<HttpClient, Task<HttpResponseMessage>> action, string operationName)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("SignalRService");
                var response = await action(client);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("SignalRService returned {StatusCode} for {Operation}", response.StatusCode, operationName);
                }
            }
            catch (BrokenCircuitException ex)
            {
                // Circuit Breaker đang mở -> Log warning và bỏ qua để job không bị fail
                _logger.LogWarning("Circuit Breaker is OPEN for SignalRService. Skipping {Operation}. Error: {Message}", operationName, ex.Message);
            }
            catch (Exception ex)
            {
                // Các lỗi khác sau khi đã dùng hết Retry
                _logger.LogError(ex, "Failed to execute {Operation} via SignalRService after all attempts.", operationName);
            }
        }
    }
}
