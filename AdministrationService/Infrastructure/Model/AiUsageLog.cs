using System;
using ShareService.Infrastructure.Model.Base;

namespace AdministrationService.Infrastructure.Model
{
    public class AiUsageLog : IAuditEntity, IMultiTenant
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid? UserId { get; set; }
        public string ModelName { get; set; } = string.Empty;
        public long PromptTokens { get; set; }
        public long CompletionTokens { get; set; }
        public long TotalTokens { get; set; }
        public decimal EstimatedCostUsd { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // IAuditEntity implementation
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public Guid? CreatedId { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public Guid? UpdatedId { get; set; }
    }
}
