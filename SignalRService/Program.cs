using SignalRService.Hubs;
using SignalRService.Services;
using ShareService.Extensions;
using Serilog;
using ShareService.Middleware;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using SignalRService.Infrastructure;

using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Render.com yêu cầu listen trên biến PORT; fallback 8080 cho Docker local
builder.WebHost.UseUrls("http://0.0.0.0:" + (Environment.GetEnvironmentVariable("PORT") ?? "8080"));

builder.Host.AddCommonSerilog();

// Add services to the container.
builder.Services.AddOpenApi();
var signalRBuilder = builder.Services.AddSignalR();

// Redis Backplane for scaling
var redisHost = builder.Configuration["Redis:Host"] ?? "redis";
var redisPort = builder.Configuration.GetValue<int>("Redis:Port", 6379);
var redisPassword = builder.Configuration["Redis:Password"] ?? "redis123";
var redisConnectionString = $"{redisHost}:{redisPort},password={redisPassword},abortConnect=false,allowAdmin=true";

var redisOptions = StackExchange.Redis.ConfigurationOptions.Parse(redisConnectionString);
var connection = StackExchange.Redis.ConnectionMultiplexer.Connect(redisOptions);
builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(connection);
builder.Services.AddHttpClient();

signalRBuilder.AddStackExchangeRedis(options => {
    options.Configuration = redisOptions;
    options.Configuration.ChannelPrefix = StackExchange.Redis.RedisChannel.Literal("SignalR:");
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.TypeInfoResolver = AppJsonContext.Default;
    });

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
