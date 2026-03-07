using SignalRService.Hubs;
using SignalRService.Services;
using ShareService.Extensions;
using Serilog;
using ShareService.Middleware;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddCommonSerilog();

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.AddSingleton<ISignalRService, SignalRService.Services.SignalRService>();

builder.Services.AddCommonHealthChecks("SignalR Service");

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };
builder.Services.AddCommonCors("AllowNextJs", allowedOrigins);

var app = builder.Build();

app.UseMiddleware<LoggingContextMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowNextJs");

app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");

app.MapCommonHealthChecks();

app.MapGet("/", () => "SignalR Service is running...");

app.Run();
