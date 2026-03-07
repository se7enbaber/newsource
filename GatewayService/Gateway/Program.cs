using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using ShareService.Middleware;
using ShareService.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddCommonSerilog();

// Bổ sung CORS
builder.Services.AddCommonCors("SignalRPolicy", new[] { "http://localhost:3000" });

// ... (phần auth và proxy giữ nguyên)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Để linh hoạt, có thể config Jwt Authority từ appsettings 
        options.Authority = builder.Configuration["JwtSettings:Authority"];
        options.RequireHttpsMetadata = false; // Phục vụ dev local bằng chứng chỉ tự ký
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateAudience = false // Hoặc theo cấu hình của OpenIddict
        };
    });

// Đăng ký YARP Reverse Proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .ConfigureHttpClient((context, handler) =>
    {
        // Bypass lỗi chứng chỉ tự ký (Self-signed SSL error) 
        // Trong môi trường Docker hoặc Dev, các service gọi nhau qua local/container name
        handler.SslOptions.RemoteCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true;
    });

builder.Services.AddCommonHealthChecks("Gateway")
    .AddUrlGroup(
        uri: new Uri("http://admin-service:8080/health/live"),
        name: "admin-service",
        tags: new[] { "downstream", "ready" })
    .AddUrlGroup(
        uri: new Uri("http://signalr:8080/health/live"),
        name: "signalr-service",
        tags: new[] { "downstream", "ready" });

/*
builder.Services.AddHealthChecksUI(options =>
{
    options.SetEvaluationTimeInSeconds(30);
    options.MaximumHistoryEntriesPerEndpoint(50);
    options.AddHealthCheckEndpoint("Gateway", "/health");
    options.AddHealthCheckEndpoint("Admin Service", "http://admin-service:8080/health");
    options.AddHealthCheckEndpoint("SignalR Service", "http://signalr:8080/health");
})
.AddInMemoryStorage();
*/

var app = builder.Build();

app.UseCors("SignalRPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<LoggingContextMiddleware>();
// Health Check Endpoints
app.MapCommonHealthChecks();

/*
app.MapHealthChecksUI(options =>
{
    options.UIPath = "/health-ui";
    options.ApiPath = "/health-ui-api";
});
*/

// Map YARP endpoint
app.MapReverseProxy();

app.Run();
