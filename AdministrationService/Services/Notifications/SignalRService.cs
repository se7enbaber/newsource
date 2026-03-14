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
    /// Interface Ä‘á»ƒ gá»­i thÃ´ng bÃ¡o real-time qua SignalR Service.
    /// </summary>
    public interface ISignalRNotificationService
    {
        Task SendNotificationAsync(Guid tenantId, string title, string message, string type = "info");
        Task SendJobStatusAsync(Guid tenantId, string jobId, string status, string message);
    }

    public record SignalRNotificationDto(Guid tenantId, string title, string message, string type);
    public record SignalRJobStatusDto(Guid tenantId, string jobId, string status, string message);


    /// <summary>
    /// HTTP Client wrapper vá»›i Resilience (Retry, Circuit Breaker, Timeout).
    /// </summary>
    public class SignalRNotificationService : ISignalRNotificationService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<SignalRNotificationService> _logger;

        public SignalRNotificationService(
            IHttpClientFactory httpClientFactory,
            ILogger<SignalRNotificationService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task SendNotificationAsync(Guid tenantId, string title, string message, string type = "info")
        {
            await ExecuteWithResilienceAsync(async (client) =>
            {
                var payload = new SignalRNotificationDto(tenantId, title, message, type);
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
                var payload = new SignalRJobStatusDto(tenantId, jobId, status, message);
                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                return await client.PostAsync("api/notifications/job-status", content);
            }, "SendJobStatus");
        }


        /// <summary>
        /// Thá»±c thi request vá»›i cÆ¡ cháº¿ catch BrokenCircuitException Ä‘á»ƒ khÃ´ng lÃ m há»ng flow chÃ­nh (nhÆ° Hangfire jobs).
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
                // Circuit Breaker Ä‘ang má»Ÿ -> Log warning vÃ  bá» qua Ä‘á»ƒ job khÃ´ng bá»‹ fail
                _logger.LogWarning("Circuit Breaker is OPEN for SignalRService. Skipping {Operation}. Error: {Message}", operationName, ex.Message);
            }
            catch (Exception ex)
            {
                // CÃ¡c lá»—i khÃ¡c sau khi Ä‘Ã£ dÃ¹ng háº¿t Retry
                _logger.LogError(ex, "Failed to execute {Operation} via SignalRService after all attempts.", operationName);
            }
        }
    }
}
