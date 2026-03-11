using FileService.Services;
using Minio;
using Serilog;
using ShareService.Storage;

var builder = WebApplication.CreateBuilder(args);

// Render.com yêu cầu listen trên biến PORT; fallback 8080 cho Docker local
builder.WebHost.UseUrls("http://0.0.0.0:" + (Environment.GetEnvironmentVariable("PORT") ?? "8080"));

// ── Serilog (giống các service khác) ─────────────────────────
builder.Host.UseSerilog((context, services, config) =>
{
    config
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .Enrich.WithEnvironmentName()
        .Enrich.WithThreadId()
        .WriteTo.Console()
        .WriteTo.File(
            path: "logs/log-.txt",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30)
        .WriteTo.Seq(
            serverUrl: context.Configuration["Seq:ServerUrl"] ?? "http://seq:5341");
});

// ── MinIO Client ──────────────────────────────────────────────
builder.Services.AddMinio(config =>
{
    config
        .WithEndpoint(builder.Configuration["MinIO:Endpoint"]!)
        .WithCredentials(
            builder.Configuration["MinIO:AccessKey"]!,
            builder.Configuration["MinIO:SecretKey"]!)
        .WithSSL(builder.Configuration.GetValue<bool>("MinIO:UseSSL", false))
        .Build();
});

// ── Services ──────────────────────────────────────────────────
builder.Services.AddScoped<IFileStorageService, MinioFileStorageService>();

// ── CORS — cho phép AdminService và Gateway gọi vào ──────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration
            .GetValue<string>("AllowedOrigins", "http://localhost:3000")!
            .Split(',');
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseSerilogRequestLogging();
app.MapControllers();

app.Run();
