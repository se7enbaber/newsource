using System;
using System.Threading.Tasks;
using AdministrationService.Infrastructure.Model;

namespace AdministrationService.Services
{
    public interface IAiGovernanceService
    {
        Task LogUsageAsync(AiUsageLog log);
        Task<AiQuota?> GetTenantQuotaAsync(Guid tenantId);
        Task<bool> IsQuotaExceededAsync(Guid tenantId);
        Task<AiQuota> UpdateQuotaAsync(Guid tenantId, long? newTokenLimit, decimal? newCostLimit);
        Task ResetQuotasAsync();
    }
}
