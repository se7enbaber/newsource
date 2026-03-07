using AdministrationService.Infrastructure.Model;
using ShareService.Repositories.Base;
using AdministrationService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AdministrationService.Repositories.Tenants
{
    public interface ITenantRepository : IBaseRepository<Tenant>
    {
        Task<Tenant?> GetByCodeAsync(string code);
        Task<List<string>> GetFeaturesAsync(Guid tenantId);
        Task UpdateFeaturesAsync(Guid tenantId, List<string> features);
    }

    public class TenantRepository(ApplicationDbContext context) : BaseRepository<Tenant>(context), ITenantRepository
    {
        public async Task<Tenant?> GetByCodeAsync(string code)
        {
            return await _dbSet.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Code.ToLower() == code.ToLower());
        }

        public async Task<List<string>> GetFeaturesAsync(Guid tenantId)
        {
            return await _context.Set<TenantFeature>()
                .Where(tf => tf.TenantId == tenantId)
                .Select(tf => tf.FeatureCode)
                .ToListAsync();
        }

        public async Task UpdateFeaturesAsync(Guid tenantId, List<string> features)
        {
            // 1. Xóa các feature cũ
            var oldFeatures = await _context.Set<TenantFeature>()
                .Where(tf => tf.TenantId == tenantId)
                .ToListAsync();
            
            _context.Set<TenantFeature>().RemoveRange(oldFeatures);

            // 2. Thêm mới
            if (features != null && features.Any())
            {
                var newFeatures = features.Distinct().Select(code => new TenantFeature
                {
                    TenantId = tenantId,
                    FeatureCode = code
                });
                await _context.Set<TenantFeature>().AddRangeAsync(newFeatures);
            }
        }
    }
}

