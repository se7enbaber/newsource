using System;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using System.Collections.Concurrent;
using SignalRService.Infrastructure;

namespace SignalRService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MonitoringController : ControllerBase
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public MonitoringController(IConnectionMultiplexer redis, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _redis = redis;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpGet("redis-info")]
        public async Task<IActionResult> GetRedisInfo()
        {
            var server = _redis.GetServer(_redis.GetEndPoints()[0]);
            var info = await server.InfoAsync();
            
            var result = new Dictionary<string, string>();
            foreach (var group in info)
            {
                foreach (var entry in group)
                {
                    result[$"{group.Key}_{entry.Key}"] = entry.Value;
                }
            }

            return Ok(result);
        }

        [HttpGet("redis-slowlog")]
        public async Task<IActionResult> GetRedisSlowLog([FromQuery] int count = 20)
        {
            var server = _redis.GetServer(_redis.GetEndPoints()[0]);
            var slowLogs = await server.SlowlogGetAsync(count);
            
            var result = slowLogs.Select(log => new SlowLogDto(
                log.UniqueId.ToString(),
                log.Time,
                log.Duration.TotalMilliseconds,
                string.Join(" ", log.Arguments.Select(a => a.ToString()))
            )).ToList();

            return Ok(result);
        }

        [HttpGet("services-health")]
        public async Task<IActionResult> GetServicesHealth()
        {
            var services = new Dictionary<string, string>
            {
                { "AdministrationService", _configuration["Services:AdminUrl"] ?? "http://admin-service:8080/health/live" },
                { "GatewayService", _configuration["Services:GatewayUrl"] ?? "http://gateway-service:8080/health/live" },
                { "FileService", _configuration["Services:FileUrl"] ?? "http://file-service:8080/health/live" },
                { "SignalRService", "self" }
            };

            var client = _httpClientFactory.CreateClient();
            var results = new ConcurrentDictionary<string, ServiceHealthDto>();

            var tasks = services.Select(async service =>
            {
                if (service.Value == "self")
                {
                    results[service.Key] = new ServiceHealthDto("Healthy", "Running", 200);
                    return;
                }

                try
                {
                    var response = await client.GetAsync(service.Value);
                    results[service.Key] = new ServiceHealthDto(
                        response.IsSuccessStatusCode ? "Healthy" : "Unhealthy",
                        response.IsSuccessStatusCode ? "Service is up" : "Service returned error",
                        (int)response.StatusCode
                    );
                }
                catch
                {
                    results[service.Key] = new ServiceHealthDto("Down", "Service unreachable", 0);
                }
            });

            await Task.WhenAll(tasks);
            return Ok(results);
        }
    }
}
