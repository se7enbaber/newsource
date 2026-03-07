using Microsoft.EntityFrameworkCore;
using ShareService.Infrastructure.Model.Base;
using ShareService.Repositories.Base;

namespace ShareService.Services.Base
{
    public interface IBaseService<TEntity, TDto, TCreateDto>
        where TEntity : class
        where TDto : class
    {
        Task<List<TDto>> GetAllAsync();
        Task<TDto?> GetByIdAsync(Guid id);
        Task<TDto> CreateAsync(TCreateDto dto);
        Task<bool> UpdateAsync(Guid id, TCreateDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<(List<TDto> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize);
    }
    public abstract class BaseService<TEntity, TDto, TCreateDto>(
        IBaseRepository<TEntity> repository,
        ITenantService tenantService) : IBaseService<TEntity, TDto, TCreateDto>
        where TEntity : class
        where TDto : class
    {
        protected readonly IBaseRepository<TEntity> _repository = repository;
        protected readonly ITenantService _tenantService = tenantService;

        // Hàm abstract để các lớp con tự định nghĩa cách map dữ liệu (hoặc dùng AutoMapper)
        protected abstract TDto MapToDto(TEntity entity);
        protected abstract TEntity MapToEntity(TCreateDto dto);

        public virtual async Task<List<TDto>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync();
            return entities.Select(MapToDto).ToList();
        }

        public virtual async Task<TDto?> GetByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity != null ? MapToDto(entity) : null;
        }

        public virtual async Task<TDto> CreateAsync(TCreateDto dto)
        {
            var entity = MapToEntity(dto);

            // Tự động gán TenantId từ TenantService cho mọi Entity mới
            if (entity is IMultiTenant multiTenantEntity)
            {
                multiTenantEntity.TenantId = _tenantService.TenantId;
            }

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
            return MapToDto(entity);
        }

        public virtual async Task<bool> DeleteAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            _repository.Delete(entity);
            return await _repository.SaveChangesAsync();
        }

        public virtual async Task<(List<TDto> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize)
        {
            var query = _repository.Entities;
            int total = await query.CountAsync();
            var items = await query.Skip((pageNumber - 1) * pageSize)
                                   .Take(pageSize)
                                   .ToListAsync();

            return (items.Select(MapToDto).ToList(), total);
        }

        public abstract Task<bool> UpdateAsync(Guid id, TCreateDto dto);
    }
}
