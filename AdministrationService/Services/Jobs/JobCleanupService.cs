using AdministrationService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AdministrationService.Services.Jobs
{
    public class JobCleanupService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ILogger<JobCleanupService> _logger;

        public JobCleanupService(ApplicationDbContext dbContext, ILogger<JobCleanupService> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task CleanupOldLogsAsync(int daysToKeep = 15)
        {
            try
            {
                var limitDate = DateTime.UtcNow.AddDays(-daysToKeep);
                int deletedCount = await _dbContext.JobLogs
                    .Where(x => x.CreatedAt < limitDate)
                    .ExecuteDeleteAsync();

                _logger.LogInformation($"[Hangfire Job] Cleaned up {deletedCount} old JobLogs older than {daysToKeep} days.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Hangfire Job] Error cleaning up old JobLogs.");
                throw;
            }
        }
    }
}
