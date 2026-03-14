extern alias PollyCore;
using ShareService.Services.Base;
using ShareService.Extensions;
using AdministrationService.Extensions;
using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using ShareService.Repositories.Base;
using AdministrationService.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Validation.AspNetCore;
using Microsoft.AspNetCore.Authorization;
using AdministrationService.Authorization;
using Hangfire;
using Hangfire.PostgreSql;
using Hangfire.Console;
using AdministrationService.Services.Notifications;
using ShareService.Infrastructure.Model.Base;
using Serilog;
using ShareService.Middleware;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Http.Resilience;
using StackExchange.Redis;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;


using DelayBackoffType = PollyCore::Polly.DelayBackoffType;

var builder = WebApplication.CreateBuilder(args);

// Render.com yêu cầu listen trên biến PORT; fallback 8080 cho Docker local
builder.WebHost.UseUrls("http://0.0.0.0:" + (Environment.GetEnvironmentVariable("PORT") ?? "8080"));

builder.Host.AddCommonSerilog();

// 1. Database Context
builder.Services.AddDbContext<ApplicationDbContext>((options) => {
    string provider = builder.Configuration["TenantSettings:DefaultProvider"] ?? "postgresql";
    string connString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

    switch (provider.ToLower())
    {
        case "sqlserver":
            options.UseSqlServer(connString);
            break;
        case "mysql":
            options.UseMySql(connString, ServerVersion.AutoDetect(connString));
            break;
        default: // postgresql
            options.UseNpgsql(connString);
            break;
    }

    options.UseOpenIddict();
});

// 2. Caching - Memory Cache
builder.Services.AddMemoryCache();

// 3. Redis Distributed Cache (with fallback to MemoryCache)
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
        Log.Information("✓ Redis cache configured at {RedisHost}:{RedisPort}", redisHost, redisPort);
    }
    else
    {
        throw new Exception("Redis connection is not connected.");
    }
}
catch (Exception ex)
{
    Log.Warning(ex, "⚠ Redis connection failed, will use MemoryCache as fallback");
    builder.Services.AddSingleton<IDistributedCache>(provider =>
    {
        var memoryCache = provider.GetRequiredService<IMemoryCache>();
        return new MemoryCacheWrapper(memoryCache);
    });
}

// 4. Permission-Based Authorization
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, FeatureAuthorizationHandler>();
builder.Services.AddAuthorization();

// 5. Hangfire
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseConsole()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))));

builder.Services.AddHangfireServer();

// 6. Identity
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));
builder.Services.AddInfrastructureServices();

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// 7. OpenIddict
builder.Services.AddOpenIddict()
    .AddCore(options => options.UseEntityFrameworkCore().UseDbContext<ApplicationDbContext>())
    .AddServer(options => {
        options.SetTokenEndpointUris("/connect/token");
        options.AllowPasswordFlow().AllowRefreshTokenFlow();
        options.AddDevelopmentEncryptionCertificate().AddDevelopmentSigningCertificate();
        options.UseAspNetCore().EnableTokenEndpointPassthrough();
        options.DisableAccessTokenEncryption();
        options.AcceptAnonymousClients();
        options.UseAspNetCore().DisableTransportSecurityRequirement();

        var issuerUri = builder.Configuration["ASPNETCORE_ISSUER_URI"];
        if (!string.IsNullOrEmpty(issuerUri))
        {
            options.SetIssuer(new Uri(issuerUri));
        }
    })
    .AddValidation(options => {
        options.UseLocalServer();
        options.UseAspNetCore();
    });

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
});

// 8. Controllers & API
builder.Services.AddControllers();


// 9. SignalR HTTP Client with Resilience
builder.Services.AddHttpClient("SignalRService", client =>
{
    var baseUrl = builder.Configuration["SignalRService:BaseUrl"] ?? "http://localhost:5003";
    client.BaseAddress = new Uri(baseUrl);
})
.AddStandardResilienceHandler(options =>
{
    var signalRConfig = builder.Configuration.GetSection("SignalRService");

    // 1. Retry 3 lần với exponential backoff
    options.Retry.MaxRetryAttempts = signalRConfig.GetValue("RetryCount", 3);
    options.Retry.BackoffType = DelayBackoffType.Exponential;
    options.Retry.Delay = TimeSpan.FromSeconds(2);
    options.Retry.OnRetry = args =>
    {
        Log.ForContext("SourceContext", "SignalRService")
           .Warning("Retry {Attempt} calling SignalRService. Reason: {Error}", 
            args.AttemptNumber + 1, args.Outcome.Exception?.Message ?? args.Outcome.Result?.StatusCode.ToString());
        return default;
    };

    // 2. Circuit breaker mở sau 5 lần fail liên tiếp
    options.CircuitBreaker.MinimumThroughput = signalRConfig.GetValue("CircuitBreakerThreshold", 5);
    options.CircuitBreaker.FailureRatio = 1.0; 
    options.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(30);
    options.CircuitBreaker.BreakDuration = TimeSpan.FromSeconds(30);
    options.CircuitBreaker.OnOpened = args =>
    {
        Log.ForContext("SourceContext", "SignalRService")
           .Fatal("SignalRService Circuit Breaker OPENED for {Duration}. Service is unavailable.", args.BreakDuration);
        return default;
    };
    options.CircuitBreaker.OnClosed = args =>
    {
        Log.ForContext("SourceContext", "SignalRService")
           .Information("SignalRService Circuit Breaker CLOSED. Service recovered.");
        return default;
    };

    // 3. Timeout 10s per request
    options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(signalRConfig.GetValue("TimeoutSeconds", 10));
});

builder.Services.AddHostedService<DbSeeder>();

// 9. OpenAPI (AOT compatible in .NET 10)
builder.Services.AddOpenApi();
builder.Services.AddCommonCors("AllowAll");

// 10. Health Checks
builder.Services.AddCommonHealthChecks("Administration Service")
    .AddNpgSql(
        connectionString: builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgresql",
        tags: new[] { "db", "ready" });

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<LoggingContextMiddleware>();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireCustomAuthorizationFilter() },
    IgnoreAntiforgeryToken = true,
});

// Middleware: Set TenantId from JWT
app.Use(async (context, next) =>
{
    var tenantService = context.RequestServices.GetRequiredService<ITenantService>();
    var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
    if (Guid.TryParse(tenantClaim, out var tenantId))
    {
        tenantService.TenantId = tenantId;
    }

    var tenantConn = context.User.FindFirst("tenant_conn")?.Value;
    if (!string.IsNullOrEmpty(tenantConn))
    {
        if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
        {
            if (tenantConn.Contains("localhost") || tenantConn.Contains("127.0.0.1"))
            {
                tenantConn = tenantConn.Replace("localhost", "postgres").Replace("127.0.0.1", "postgres");
            }
        }
        var dbContext = context.RequestServices.GetRequiredService<ApplicationDbContext>();
        dbContext.Database.SetConnectionString(tenantConn);
    }

    await next();
});

app.MapCommonHealthChecks();
app.MapControllers();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");

await app.ApplyMigrationsAsync();

app.Run();

// ========== Helper Classes ==========

public class HangfireCustomAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        return true;
    }
}

// Fallback IDistributedCache implementation using IMemoryCache
public class MemoryCacheWrapper : IDistributedCache
{
    private readonly IMemoryCache _memoryCache;

    public MemoryCacheWrapper(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public byte[]? Get(string key)
    {
        return _memoryCache.TryGetValue(key, out byte[]? value) ? value : null;
    }

    public async Task<byte[]?> GetAsync(string key, CancellationToken token = default)
    {
        return Get(key);
    }

    public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
    {
        var cacheOptions = new MemoryCacheEntryOptions();
        
        if (options.AbsoluteExpiration.HasValue)
            cacheOptions.AbsoluteExpiration = options.AbsoluteExpiration;
        if (options.AbsoluteExpirationRelativeToNow.HasValue)
            cacheOptions.AbsoluteExpirationRelativeToNow = options.AbsoluteExpirationRelativeToNow;
        if (options.SlidingExpiration.HasValue)
            cacheOptions.SlidingExpiration = options.SlidingExpiration;

        _memoryCache.Set(key, value, cacheOptions);
    }

    public async Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
    {
        Set(key, value, options);
    }

    public void Refresh(string key)
    {
        _memoryCache.TryGetValue(key, out _);
    }

    public async Task RefreshAsync(string key, CancellationToken token = default)
    {
        Refresh(key);
    }

    public void Remove(string key)
    {
        _memoryCache.Remove(key);
    }

    public async Task RemoveAsync(string key, CancellationToken token = default)
    {
        Remove(key);
    }
}
