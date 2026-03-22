using ShareService.Services.Base;
using AdministrationService.Infrastructure.Data;
using AdministrationService.Repositories.Tenants;
using AdministrationService.Infrastructure.Model;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using Hangfire.Console;
using Hangfire.Server;
using AdministrationService.Services.Notifications;
using AdministrationService.Repositories.Jobs;
using ShareService.Infrastructure.Model.Base;

namespace AdministrationService.Services
{
    public interface ITenantMigrationJob
    {
        Task RunMigrationAsync(Guid tenantId, Guid? callerTenantId = null, PerformContext? performContext = null);
    }

    [AutomaticRetry(Attempts = 1)]
    public class TenantMigrationJob : ITenantMigrationJob
    {
        private readonly ITenantRepository _tenantRepository;
        private readonly ITenantDbSeedService _seedService;
        private readonly IServiceProvider _serviceProvider;
        private readonly ITenantService _tenantService;
        private readonly ISignalRNotificationService _signalRService;
        private readonly IJobLogRepository _jobLogRepository;
        private readonly ILogger<TenantMigrationJob> _logger;

        public TenantMigrationJob(
            ITenantRepository tenantRepository,
            ITenantDbSeedService seedService,
            IServiceProvider serviceProvider,
            ITenantService tenantService,
            ISignalRNotificationService signalRService,
            IJobLogRepository jobLogRepository,
            ILogger<TenantMigrationJob> logger)
        {
            _tenantRepository = tenantRepository;
            _seedService = seedService;
            _serviceProvider = serviceProvider;
            _tenantService = tenantService;
            _signalRService = signalRService;
            _jobLogRepository = jobLogRepository;
            _logger = logger;
        }

        public async Task RunMigrationAsync(Guid tenantId, Guid? callerTenantId = null, PerformContext? performContext = null)
        {
            _logger.LogInformation("Starting background migration for tenant {TenantId}", tenantId);
            performContext.WriteLine("Starting background migration for tenant {0}", tenantId);

            var tenant = await _tenantRepository.GetByIdAsync(tenantId);
            if (tenant == null || string.IsNullOrEmpty(tenant.ConnectionString))
            {
                _logger.LogWarning("Migration aborted: Tenant {TenantId} not found or missing connection string", tenantId);
                performContext.SetTextColor(ConsoleTextColor.Yellow);
                performContext.WriteLine("Migration aborted: Tenant {0} not found or missing connection string", tenantId);
                return;
            }

            var connectionString = tenant.ConnectionString;
            // Patch localhost if running in Docker container
            if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
            {
                if (connectionString.Contains("localhost") || connectionString.Contains("127.0.0.1"))
                {
                    _logger.LogInformation("Patching localhost ConnectionString for Docker...");
                    performContext.WriteLine("Patching localhost ConnectionString for Docker...");
                    connectionString = connectionString.Replace("localhost", "postgres").Replace("127.0.0.1", "postgres");
                }
            }

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            var provider = tenant.DbProvider?.ToLower() ?? "postgresql";

            switch (provider)
            {
                case "sqlserver":
                    optionsBuilder.UseSqlServer(connectionString);
                    break;
                case "mysql":
                    optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
                    break;
                case "postgresql":
                default:
                    optionsBuilder.UseNpgsql(connectionString);
                    break;
            }

            var jobLog = new JobLog
            {
                JobId = Guid.NewGuid().ToString(),
                JobName = "Tenant Migration",
                Status = "Running",
                Message = $"Starting migration for {tenant.Name}",
                StartedAt = DateTime.UtcNow,
                TenantId = tenantId
            };
            await _jobLogRepository.AddAsync(jobLog);
            await _jobLogRepository.SaveChangesAsync();

            await _signalRService.SendJobStatusAsync(tenantId, jobLog.JobId, "Running", jobLog.Message);
            if (callerTenantId.HasValue && callerTenantId != tenantId)
            {
                await _signalRService.SendJobStatusAsync(callerTenantId.Value, jobLog.JobId, "Running", jobLog.Message);
            }

            try
            {
                // Fake session cho Job Ä‘ang cháº¡y ngáº§m báº±ng cÃ¡ch chá»§ Ä‘á»™ng set TenantId
                _tenantService.TenantId = tenant.Id;

                // Sá»­ dá»¥ng ApplicationDbContext vá»›i Connection String cá»§a Tenant
                using var context = new ApplicationDbContext(optionsBuilder.Options, _tenantService, _serviceProvider);

                _logger.LogInformation("Applying migrations for tenant {TenantName}...", tenant.Name);
                performContext.WriteLine("Applying migrations for tenant {0}...", tenant.Name);
                
                try
                {
                    await context.Database.MigrateAsync();
                }
                catch (Exception migrateEx)
                {
                    string exceptionMessage = migrateEx.ToString();
                    if (exceptionMessage.Contains("42P07") || exceptionMessage.Contains("already exists") || exceptionMessage.Contains("23505"))
                    {
                        _logger.LogWarning("Migration exception (idempotent) for tenant {TenantName}. Attempting history sync...", tenant.Name);
                        performContext.SetTextColor(ConsoleTextColor.Yellow);
                        performContext.WriteLine("Warning: Tables already exist. Syncing EF history for Initial migration...");
                        
                        // Thông báo cho UI biết đang xử lý sự cố nhỏ
                        await _signalRService.SendJobStatusAsync(tenantId, jobLog.JobId, "Running", "Phát hiện DB đã tồn tại, đang đồng bộ lịch sửa migration...");
                        if (callerTenantId.HasValue && callerTenantId != tenantId)
                        {
                            await _signalRService.SendJobStatusAsync(callerTenantId.Value, jobLog.JobId, "Running", "Phát hiện DB đã tồn tại, đang đồng bộ lịch sửa migration...");
                        }

                        try 
                        {
                            var sqlPostgres = "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('20260315074500_Initial', '10.0.3') ON CONFLICT DO NOTHING;";
                            var sqlOther = "IF NOT EXISTS(SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260315074500_Initial') INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260315074500_Initial', '10.0.3');";
                            var sql = provider == "postgresql" ? sqlPostgres : sqlOther;
                            
                            await context.Database.ExecuteSqlRawAsync(sql);
                            
                            // Chạy lại migrate để apply các migration sau Initial (nếu có)
                            await context.Database.MigrateAsync();
                        }
                        catch (Exception ex) 
                        {
                            _logger.LogWarning(ex, "Failed to sync EF history or apply subsequent migrations for {TenantName}", tenant.Name);
                            throw;
                        }
                    }
                    else
                    {
                        throw;
                    }
                }

                _logger.LogInformation("Seeding initial data for tenant {TenantName}...", tenant.Name);
                performContext.WriteLine("Seeding initial data for tenant {0}...", tenant.Name);
                await _seedService.SeedTenantDataAsync(tenant, context);

                tenant.IsMigrated = true;
                tenant.LastMigratedAt = DateTime.UtcNow;
                _tenantRepository.Update(tenant);
                await _tenantRepository.SaveChangesAsync();

                _logger.LogInformation("Migration completed successfully for tenant {TenantName}", tenant.Name);
                performContext.SetTextColor(ConsoleTextColor.Green);
                performContext.WriteLine("Migration completed successfully for tenant {0}", tenant.Name);

                jobLog.Status = "Success";
                jobLog.Message = $"Migration completed for {tenant.Name}";
                jobLog.CompletedAt = DateTime.UtcNow;
                _jobLogRepository.Update(jobLog);
                await _jobLogRepository.SaveChangesAsync();

                await _signalRService.SendNotificationAsync(tenantId, "Migration Success", jobLog.Message, "success");
                await _signalRService.SendJobStatusAsync(tenantId, jobLog.JobId, "Success", jobLog.Message);

                if (callerTenantId.HasValue && callerTenantId != tenantId)
                {
                    await _signalRService.SendNotificationAsync(callerTenantId.Value, "Migration Success", jobLog.Message, "success");
                    await _signalRService.SendJobStatusAsync(callerTenantId.Value, jobLog.JobId, "Success", jobLog.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during background migration for tenant {TenantName}", tenant.Name);
                performContext.SetTextColor(ConsoleTextColor.Red);
                performContext.WriteLine("Error: {0}", ex.Message);
                
                // Refresh log entry from DB if needed
                var errorJobLogs = await _jobLogRepository.FindAsync(x => x.TenantId == tenantId && x.Status == "Running");
                var firstLog = errorJobLogs.FirstOrDefault();
                if (firstLog != null)
                {
                    firstLog.Status = "Failed";
                    firstLog.Message = $"Error: {ex.Message}";
                    firstLog.CompletedAt = DateTime.UtcNow;
                    _jobLogRepository.Update(firstLog);
                    await _jobLogRepository.SaveChangesAsync();
                    
                    await _signalRService.SendNotificationAsync(tenantId, "Migration Failed", firstLog.Message, "error");
                    await _signalRService.SendJobStatusAsync(tenantId, firstLog.JobId, "Failed", firstLog.Message);

                    if (callerTenantId.HasValue && callerTenantId != tenantId)
                    {
                        await _signalRService.SendNotificationAsync(callerTenantId.Value, "Migration Failed", firstLog.Message, "error");
                        await _signalRService.SendJobStatusAsync(callerTenantId.Value, firstLog.JobId, "Failed", firstLog.Message);
                    }
                }

                throw; 
            }
        }
    }
}

