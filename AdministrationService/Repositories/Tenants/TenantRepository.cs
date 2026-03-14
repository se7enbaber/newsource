using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using ShareService.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace AdministrationService.Repositories.Tenants
{
    public interface ITenantRepository : IBaseRepository<Tenant>
    {
        Task<Tenant?> GetByCodeAsync(string code);
        Task UpdateFeaturesAsync(Guid tenantId, List<string> features);
        Task<List<string>> GetFeaturesAsync(Guid tenantId);
    }

    public class TenantRepository(ApplicationDbContext context)
        : BaseRepository<Tenant>(context), ITenantRepository
    {
        public async Task<Tenant?> GetByCodeAsync(string code)
        {
             return await _dbSet.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Code == code);
        }

        public async Task UpdateFeaturesAsync(Guid tenantId, List<string> features)
        {
            var current = await _context.Set<TenantFeature>().Where(f => f.TenantId == tenantId).ToListAsync();
            _context.Set<TenantFeature>().RemoveRange(current);
            foreach (var f in features)
            {
                _context.Set<TenantFeature>().Add(new TenantFeature { TenantId = tenantId, FeatureCode = f });
            }
        }

        public async Task<List<string>> GetFeaturesAsync(Guid tenantId)
        {
            return await _context.Set<TenantFeature>().Where(f => f.TenantId == tenantId).Select(f => f.FeatureCode).ToListAsync();
        }
    }
}
