using ShareService.Infrastructure.Model.Base;
using Microsoft.AspNetCore.Identity;

namespace AdministrationService.Infrastructure.Model
{


    public class ApplicationRole : IdentityRole<Guid>, IAuditEntity, IAuditDeleteEntity, IMultiTenant
    {
        public Guid TenantId { get; set; }
        // Mô t? vai trò (Ð? hi?n gi?i thích trong dropdown nhu "Bi?n t?p viên", "Ngu?i xem")
        public string? Description { get; set; }

        // Lo?i vai trò: System (m?c d?nh không cho xóa) ho?c Custom (do ngu?i dùng t?o)
        public bool IsSystemRole { get; set; } = false;

        // Tr?ng thái ho?t d?ng c?a Role
        public bool IsActive { get; set; } = true;
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

