using ShareService.Infrastructure.Model.Base;

namespace AdministrationService.Infrastructure.Model
{
    public class Tenant: IAuditEntity, IAuditDeleteEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = default!;
        public string Code { get; set; } = default!; // Ví dụ: "apple"
        public string? LogoUrl { get; set; }

        // Các field mới để tách DB
        public string? ConnectionString { get; set; }
        public string? DbProvider { get; set; } // "PostgreSQL", "SqlServer", "MySql"
        public bool IsMigrated { get; set; }
        public DateTime? LastMigratedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy { get; set; }
        public Guid? DeletedId { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public Guid? CreatedId { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public Guid? UpdatedId { get; set; }
    }
}
