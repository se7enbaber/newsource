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

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddCommonSerilog();

// ... (phần code DB giữ nguyên)

// 4. Permission-Based Authorization
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, FeatureAuthorizationHandler>();
builder.Services.AddAuthorization();
builder.Services.AddMemoryCache();

// 5. Hangfire
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseConsole() // Thêm Console logging vào DashBoard
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))));

builder.Services.AddHangfireServer();

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


// 2. Identity
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));

// Thay thế hàng tá dòng AddScoped bằng:
builder.Services.AddInfrastructureServices();

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// 3. OpenIddict
builder.Services.AddOpenIddict()
    .AddCore(options => options.UseEntityFrameworkCore().UseDbContext<ApplicationDbContext>())
    .AddServer(options => {
        options.SetTokenEndpointUris("/connect/token");
        options.AllowPasswordFlow().AllowRefreshTokenFlow();
        options.AddDevelopmentEncryptionCertificate().AddDevelopmentSigningCertificate();
        options.UseAspNetCore().EnableTokenEndpointPassthrough();
        options.DisableAccessTokenEncryption();
        options.AcceptAnonymousClients(); // Cho phép client không khai báo client_id
        // Cho phép HTTP trong container (Docker) không bắt buộc HTTPS
        options.UseAspNetCore().DisableTransportSecurityRequirement();
    })
    .AddValidation(options => {
        options.UseLocalServer();
        options.UseAspNetCore();
    });

// Log chi tiết lỗi xác thực ra Console
// builder.Logging.AddConsole().SetMinimumLevel(LogLevel.Debug);

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    });

builder.Services.AddControllers();
// SignalR: đăng ký HTTP client để gọi sang SignalRService microservice
builder.Services.AddHttpClient("SignalRService");
builder.Services.AddScoped<ISignalRService, SignalRHttpClient>();
builder.Services.AddHostedService<DbSeeder>(); // Tự động tạo dữ liệu mẫu

builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCommonCors("AllowAll");

// Health Checks
builder.Services.AddCommonHealthChecks("Administration Service")
    .AddNpgSql(
        connectionString: builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgresql",
        tags: new[] { "db", "ready" });

// // Do not register UI here to avoid version clashes. Endpoints work fine.

var app = builder.Build();

// Đặt CORS sớm nhất để preflight requests không bị chặn
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<LoggingContextMiddleware>();
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    // Cho phép truy cập từ client bên ngoài (qua Gateway/Proxy)
    Authorization = new[] { new HangfireCustomAuthorizationFilter() },
    IgnoreAntiforgeryToken = true, // Quan trọng để DashBoard chạy qua Proxy mà không lo CSRF mismatch
});

// Middleware lấy TenantId từ JWT — đặt SAU UseAuthentication (JWT đã được parse)
// nhưng TRƯỚC MapControllers (controllers cần dùng TenantId)
app.Use(async (context, next) =>
{
    var tenantService = context.RequestServices.GetRequiredService<ITenantService>();
    var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
    if (Guid.TryParse(tenantClaim, out var tenantId))
    {
        tenantService.TenantId = tenantId;
    }

    // Nâng cao: Ép cập nhật ConnectionString cho ApplicationDbContext của request hiện tại nếu Tenant có DB riêng
    var tenantConn = context.User.FindFirst("tenant_conn")?.Value;
    if (!string.IsNullOrEmpty(tenantConn))
    {
        // Patch localhost if running in Docker container
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

// Health Check Endpoints
app.MapCommonHealthChecks();

// // app.MapHealthChecksUI(options =>

app.MapControllers();
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Administration API V1");
});

// Tự động chạy Migration và Seed dữ liệu (DbSeeder đã được đăng ký là HostedService nên sẽ tự chạy StartAsync)
// Không cần gọi ApplyMigrationsAsync ở đây vì DbSeeder đã lo phần EnsureCreated/Migration ban đầu.
// NotificationHub đã được chuyển sang SignalRService microservice riêng biệt
app.UseCors("AllowAll");

await app.ApplyMigrationsAsync();

app.Run();

// --- Definition for Hangfire Dashboard Authorization ---
public class HangfireCustomAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        // Trong môi trường dev/local có thể trả về true luôn.
        // Trong Production thực tế, nên check JWT hoặc IP của Gateway.
        return true; 
    }
}
