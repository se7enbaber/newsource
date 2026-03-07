using System;

namespace ShareService.Infrastructure.Model.Base
{
    public class JobLog : IAuditEntity
    {
        public Guid Id { get; set; }
        public string JobId { get; set; } = string.Empty;
        public string JobName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Success, Failed, Running
        public string Message { get; set; } = string.Empty;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Guid? TenantId { get; set; }

        // IAuditEntity implementation
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public Guid? CreatedId { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public Guid? UpdatedId { get; set; }
    }
}
