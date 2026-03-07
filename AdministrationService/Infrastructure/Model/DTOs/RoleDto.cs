namespace AdministrationService.Infrastructure.Model
{
    public class RoleDto : CreateRoleDto
    {
        public Guid Id { get; set; }
    }

    public class CreateRoleDto
    {
        public string Name { get; set; } = default!; 
        public string? Description { get; set; }

        // Loại vai trò: System (mặc định không cho xóa) hoặc Custom (do người dùng tạo)
        public bool IsSystemRole { get; set; } = false;

        // Trạng thái hoạt động của Role
        public bool IsActive { get; set; } = true;
        public List<string> Permissions { get; set; } = new();
    }

    public class AssignRoleDto
    {
        public Guid UserId { get; set; }
        public string RoleName { get; set; } = default!;
    }
}