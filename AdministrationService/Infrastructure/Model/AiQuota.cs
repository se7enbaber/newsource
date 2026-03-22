using System;
using ShareService.Infrastructure.Model.Base;

namespace AdministrationService.Infrastructure.Model
{
    public class AiQuota : IAuditEntity
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public long MonthlyTokenLimit { get; set; } = 1000000; // Mặc định 1M tokens
        public decimal MonthlyCostLimitUsd { get; set; } = 10.0m; // Mặc định $10

        public long CurrentUsedTokens { get; set; }
        public decimal CurrentUsedCostUsd { get; set; }

        public DateTime LastResetDate { get; set; } = DateTime.UtcNow;
        public bool IsBlocked { get; set; } = false;

        // IAuditEntity implementation
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public Guid? CreatedId { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public Guid? UpdatedId { get; set; }
    }
}
