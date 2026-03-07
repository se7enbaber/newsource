namespace ShareService.Infrastructure.Model.Base
{
    public interface IAuditEntity
    {
        DateTime CreatedAt { get; set; }
        string? CreatedBy { get; set; }
        Guid? CreatedId { get; set; }
        DateTime? UpdatedAt { get; set; }
        string? UpdatedBy { get; set; }
        Guid? UpdatedId { get; set; }
    }

    public interface IAuditDeleteEntity// Dùng cho Soft Delete
    {
        DateTime? DeletedAt { get; set; }
        string? DeletedBy { get; set; }
        Guid? DeletedId { get; set; }
        bool IsDeleted { get; set; } // Dùng cho Soft Delete
    }
}
