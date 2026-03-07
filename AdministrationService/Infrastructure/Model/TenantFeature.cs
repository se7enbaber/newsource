using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AdministrationService.Infrastructure.Model
{
    public class TenantFeature
    {
        public Guid TenantId { get; set; }
        
        [MaxLength(256)]
        public string FeatureCode { get; set; } = default!;

        // Navigation property (Optional, but good for EF)
        [ForeignKey(nameof(TenantId))]
        public virtual Tenant Tenant { get; set; } = default!;
    }
}
