using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Gateway.Extensions;

public static class RateLimiterExtension
{
    public static IServiceCollection AddDynamicRateLimiter(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var ip = context.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                            ?? context.Connection.RemoteIpAddress?.ToString() 
                            ?? "unknown";

                // Bỏ qua Rate Limiter cho SignalR Hub và các kết nối WebSockets để tránh lỗi 1006 Disconnected
                if (context.Request.Path.StartsWithSegments("/notificationHub") || context.WebSockets.IsWebSocketRequest)
                {
                    return RateLimitPartition.GetNoLimiter(ip);
                }

                var cache = context.RequestServices.GetService<IDistributedCache>();
                int limit = 100; // Default fallback global limit

                if (cache != null)
                {
                    try
                    {
                        var configValue = cache.GetString("RateLimit:Global:PermitLimit");
                        if (!string.IsNullOrEmpty(configValue) && int.TryParse(configValue, out int parsedLimit))
                        {
                            limit = parsedLimit;
                        }
                    }
                    catch
                    {
                        // Ignore cache error to let request continue
                    }
                }

                return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = limit,
                    Window = TimeSpan.FromSeconds(10), // Configurable if needed
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // Specific policy for Auth endpoint
            options.AddPolicy("AuthPolicy", context =>
            {
                var ip = context.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                            ?? context.Connection.RemoteIpAddress?.ToString() 
                            ?? "unknown";

                var cache = context.RequestServices.GetService<IDistributedCache>();
                int limit = 5; // Default strict fallback auth limit

                if (cache != null)
                {
                    try
                    {
                        var configValue = cache.GetString("RateLimit:Auth:PermitLimit");
                        if (!string.IsNullOrEmpty(configValue) && int.TryParse(configValue, out int parsedLimit))
                        {
                            limit = parsedLimit;
                        }
                    }
                    catch
                    {
                        // Ignore cache error
                    }
                }

                return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = limit,
                    Window = TimeSpan.FromSeconds(30),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.Headers.RetryAfter = "10";
                await context.HttpContext.Response.WriteAsync("{\"error\": \"Too many requests. Please try again later.\"}", cancellationToken: token);
            };
        });

        return services;
    }
}
