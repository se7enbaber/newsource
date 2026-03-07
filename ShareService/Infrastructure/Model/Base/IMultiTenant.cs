namespace ShareService.Infrastructure.Model.Base
{
    public interface IMultiTenant
    { 
        Guid TenantId { get; set; }
    }
}
