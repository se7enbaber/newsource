using System;
using System.Linq;
using System.Threading.Tasks;
using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Services.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AdministrationService.Services.AiGovernance
{
    public class AiGovernanceService : IAiGovernanceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AiGovernanceService> _logger;
        private readonly ISignalRNotificationService _notificationService;

        public AiGovernanceService(
            ApplicationDbContext context, 
            ILogger<AiGovernanceService> logger,
            ISignalRNotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task LogUsageAsync(AiUsageLog log)
        {
            _context.AiUsageLogs.Add(log);
            
            // Update Quota status
            var quota = await _context.AiQuotas
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(q => q.TenantId == log.TenantId);

            if (quota == null)
            {
                quota = new AiQuota 
                { 
                    TenantId = log.TenantId,
                    MonthlyTokenLimit = 1000000, // Default 1M
                    MonthlyCostLimitUsd = 10.0m // Default $10
                };
                _context.AiQuotas.Add(quota);
            }

            quota.CurrentUsedTokens += log.TotalTokens;
            quota.CurrentUsedCostUsd += log.EstimatedCostUsd;

            // Threshold checks
            var usagePercent = (double)quota.CurrentUsedTokens / quota.MonthlyTokenLimit;
            
            if (usagePercent >= 1.0)
            {
                quota.IsBlocked = true;
                _logger.LogCritical($"Tenant {log.TenantId} exceeded 100% of AI Quota token limit.");
                await _notificationService.SendNotificationAsync(
                    log.TenantId, 
                    "AI service blocked", 
                    "Dịch vụ AI đã bị tạm khóa do vượt quá hạn mức sử dụng (100%).", 
                    "error");
            }
            else if (usagePercent >= 0.9)
            {
                _logger.LogWarning($"Tenant {log.TenantId} reached 90% of AI Quota token limit.");
                await _notificationService.SendNotificationAsync(
                    log.TenantId, 
                    "AI Quota Warning", 
                    "Bạn đã sử dụng hết 90% hạn mức AI của tháng này.", 
                    "warning");
            }

            await _context.SaveChangesAsync();
        }

        public async Task<AiQuota?> GetTenantQuotaAsync(Guid tenantId)
        {
            return await _context.AiQuotas
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(q => q.TenantId == tenantId);
        }

        public async Task<bool> IsQuotaExceededAsync(Guid tenantId)
        {
            return await _context.AiQuotas
                .IgnoreQueryFilters()
                .Where(q => q.TenantId == tenantId)
                .Select(q => q.IsBlocked)
                .FirstOrDefaultAsync();
        }

        public async Task<AiQuota> UpdateQuotaAsync(Guid tenantId, long? newTokenLimit, decimal? newCostLimit)
        {
            var quota = await _context.AiQuotas
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(q => q.TenantId == tenantId);

            if (quota == null)
            {
                quota = new AiQuota 
                { 
                    TenantId = tenantId,
                    MonthlyTokenLimit = 1000000,
                    MonthlyCostLimitUsd = 10.0m
                };
                _context.AiQuotas.Add(quota);
            }

            if (newTokenLimit.HasValue)
                quota.MonthlyTokenLimit = newTokenLimit.Value;
                
            if (newCostLimit.HasValue)
                quota.MonthlyCostLimitUsd = newCostLimit.Value;
            
            // Auto unblock if limits increase
            if (quota.MonthlyTokenLimit > 0 && (double)quota.CurrentUsedTokens / quota.MonthlyTokenLimit < 1.0)
            {
                quota.IsBlocked = false;
            }

            await _context.SaveChangesAsync();
            return quota;
        }

        public async Task ResetQuotasAsync()
        {
            var allQuotas = await _context.AiQuotas.IgnoreQueryFilters().ToListAsync();
            foreach (var q in allQuotas)
            {
                q.CurrentUsedTokens = 0;
                q.CurrentUsedCostUsd = 0;
                q.IsBlocked = false;
                q.LastResetDate = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Reset AI Quotas for {allQuotas.Count} tenants.");
        }
    }
}
