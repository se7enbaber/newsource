using System.ComponentModel.DataAnnotations;

namespace AdministrationService.Infrastructure.Model.DTOs
{
    public class TenantDto : CreateTenantDto
    {
        public Guid Id { get; set; }
        public bool IsMigrated { get; set; }
        public DateTime? LastMigratedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateTenantDto
    {
        [Required(ErrorMessage = "Tên Tenant không được để trống")]
        public string Name { get; set; } = default!;

        [Required(ErrorMessage = "Mã Tenant không được để trống")]
        public string Code { get; set; } = default!;

        public string? ConnectionString { get; set; }
        public string? DbProvider { get; set; }
        public string? LogoUrl { get; set; }

        // Danh sách các mã tính năng (FeatureCode)
        public List<string> Features { get; set; } = new();
    }
}
