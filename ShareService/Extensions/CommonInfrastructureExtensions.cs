using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;
using Microsoft.Extensions.Configuration;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Routing;

namespace ShareService.Extensions
{
    public static class CommonInfrastructureExtensions
    {
        public static void AddCommonSerilog(this ConfigureHostBuilder host)
        {
            host.UseSerilog((context, services, config) =>
            {
                config
                    .ReadFrom.Configuration(context.Configuration)
                    .ReadFrom.Services(services)
                    .MinimumLevel.Information()
                    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
                    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
                    .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
                    .Enrich.FromLogContext()
                    .Enrich.WithEnvironmentName()
                    .Enrich.WithThreadId()
                    .WriteTo.Console()
                    .WriteTo.File(
                        path: "logs/log-.txt",
                        rollingInterval: RollingInterval.Day,
                        retainedFileCountLimit: 30,
                        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {TenantId} {UserId} {Message:lj}{NewLine}{Exception}")
                    .WriteTo.Seq(
                        serverUrl: context.Configuration["Seq:ServerUrl"] ?? "http://seq:5341");
            });
        }

        public static IHealthChecksBuilder AddCommonHealthChecks(this IServiceCollection services, string serviceName)
        {
            return services.AddHealthChecks()
                .AddCheck("self", () => HealthCheckResult.Healthy($"{serviceName} is running"),
                    tags: new[] { "service", "live" });
        }

        public static void MapCommonHealthChecks(this IEndpointRouteBuilder app)
        {
            app.MapHealthChecks("/health", new HealthCheckOptions
            {
                Predicate = _ => true,
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
            });

            app.MapHealthChecks("/health/live", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains("live"),
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
            });

            app.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains("ready"),
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
            });
        }

        public static void AddCommonCors(this IServiceCollection services, string policyName, string[]? allowedOrigins = null)
        {
            services.AddCors(options =>
            {
                options.AddPolicy(policyName, policy =>
                {
                    if (allowedOrigins == null || allowedOrigins.Length == 0)
                    {
                        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
                    }
                    else
                    {
                        policy.WithOrigins(allowedOrigins)
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    }
                });
            });
        }
    }
}
