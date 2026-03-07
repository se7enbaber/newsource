using ShareService.Infrastructure.Model.Base;
using Microsoft.AspNetCore.Identity;

namespace AdministrationService.Infrastructure.Model
{

    public class ApplicationUser : IdentityUser<Guid>, IAuditEntity, IAuditDeleteEntity, IMultiTenant
    {
        public Guid TenantId { get; set; }
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
        // Thông tin cá nhân (Thông Tin Cá Nhân)
        public string? FullName { get; set; }
        public DateTime? DateOfBirth { get; set; }

        // Tr?ng thái (Phân Quy?n & Tr?ng Thái)
        public bool IsActive { get; set; } = true; // Switch Ho?t d?ng
        public bool IsEmailVerified { get; set; } = false; // Switch Xác minh Email

        // Tùy ch?n khác (Tùy ch?n khác)
        public string? AvatarUrl { get; set; }
        public string? AvatarJsonConfig { get; set; } // Ðu?ng d?n ?nh d?i di?n (JSON) nhu hình

    }
}
