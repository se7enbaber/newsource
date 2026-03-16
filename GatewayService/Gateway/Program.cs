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
using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;
using Gateway.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Render.com yêu cầu listen trên biến PORT; fallback 8080 cho Docker local
builder.WebHost.UseUrls("http://0.0.0.0:" + (Environment.GetEnvironmentVariable("PORT") ?? "8080"));

builder.Host.AddCommonSerilog();

// Redis cache
builder.Services.AddMemoryCache();
var redisHost = builder.Configuration["Redis:Host"] ?? "redis";
var redisPort = builder.Configuration.GetValue<int>("Redis:Port", 6379);
var redisPassword = builder.Configuration["Redis:Password"] ?? "redis123";

try
{
    var redisOptions = new ConfigurationOptions
    {
        EndPoints = { $"{redisHost}:{redisPort}" },
        Password = redisPassword,
        AllowAdmin = false,
        ConnectTimeout = 3000,
        SyncTimeout = 3000,
        AbortOnConnectFail = false
    };

    var connection = ConnectionMultiplexer.Connect(redisOptions);
    if (connection.IsConnected)
    {
        builder.Services.AddSingleton<IConnectionMultiplexer>(connection);
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = $"{redisHost}:{redisPort},password={redisPassword},abortConnect=false";
        });
        Log.Information("✓ Gateway Redis cache configured at {RedisHost}:{RedisPort}", redisHost, redisPort);
    }
}
catch (Exception ex)
{
    Log.Warning(ex, "⚠ Gateway Redis connection failed, will use MemoryCache as fallback.");
}

// CORS
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000", "http://localhost:3001", "http://localhost:3011" };
builder.Services.AddCommonCors("SignalRPolicy", allowedOrigins);

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["JwtSettings:Authority"];
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateAudience = false,
            ValidIssuer = builder.Configuration["ASPNETCORE_ISSUER_URI"],
            ValidateIssuer = !string.IsNullOrEmpty(builder.Configuration["ASPNETCORE_ISSUER_URI"])
        };
    });

// YARP Reverse Proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.RemoteCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true;
    });

// Health Checks
builder.Services.AddCommonHealthChecks("Gateway")
    .AddUrlGroup(
        uri: new Uri("http://admin-service:8080/health/live"),
        name: "admin-service",
        tags: new[] { "downstream", "ready" })
    .AddUrlGroup(
        uri: new Uri("http://signalr:10000/health/live"),
        name: "signalr-service",
        tags: new[] { "downstream", "ready" });

// Add Rate Limiter logic built in Extensions
builder.Services.AddDynamicRateLimiter();

var app = builder.Build();

app.UseRouting();
app.UseCors("SignalRPolicy");
app.UseRateLimiter();
app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<LoggingContextMiddleware>();

// Health Check Endpoints
app.MapCommonHealthChecks();

// YARP Reverse Proxy
app.MapReverseProxy();

app.Run();
