using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace ShareService.Middleware;

/// <summary>
/// Middleware tự động đính kèm TenantId, UserId, TraceId vào mọi dòng log
/// Áp dụng cho tất cả .NET service trong hệ thống
/// </summary>
public class LoggingContextMiddleware
{
    private readonly RequestDelegate _next;

    public LoggingContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var tenantId = context.User.FindFirst("tenant_id")?.Value ?? 
                       context.User.FindFirst("TenantId")?.Value ?? 
                       "unknown";
                       
        var userId   = context.User.FindFirst("sub")?.Value ?? 
                       context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? 
                       "anonymous";
                       
        var traceId  = context.TraceIdentifier;

        using (LogContext.PushProperty("TenantId", tenantId))
        using (LogContext.PushProperty("UserId", userId))
        using (LogContext.PushProperty("TraceId", traceId))
        {
            await _next(context);
        }
    }
}
