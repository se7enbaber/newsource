using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

using ShareService.Infrastructure.Model.Base;
using ShareService.Services.Base;

namespace ShareService.Repositories.Base
{
    public interface IBaseRepository<T> where T : class
    {
        IQueryable<T> Entities { get; }
        Task<T?> GetByIdAsync(Guid id);
        Task<List<T>> GetAllAsync();
        Task AddAsync(T entity);
        void Update(T entity);
        void Delete(T entity);
        Task<bool> SaveChangesAsync();
        IQueryable<T> GetAllIgnoreFilters();
        Task<(List<T> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize, Expression<Func<T, bool>>? predicate = null);
        Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate);
    }
    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly DbContext _context;
        protected readonly DbSet<T> _dbSet;

        public BaseRepository(DbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        // Trả về IQueryable để có thể Filter thêm (OData, Paging...)
        public virtual IQueryable<T> Entities => _dbSet;

        public virtual async Task<T?> GetByIdAsync(Guid id)
        {
            return await _dbSet.FindAsync(id);
        }

        public virtual async Task<List<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        public virtual async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public virtual void Update(T entity)
        {
            _dbSet.Update(entity);
        }

        public virtual void Delete(T entity)
        {
            // Nhờ logic trong SaveChangesAsync chúng ta đã viết, 
            // lệnh này sẽ tự chuyển thành Soft Delete (IsDeleted = true)
            _dbSet.Remove(entity);
        }

        public virtual async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
        public virtual IQueryable<T> GetAllIgnoreFilters()
        {
            // Dùng IgnoreQueryFilters để xuyên qua tấm màn TenantId và IsDeleted
            return _dbSet.IgnoreQueryFilters();
        }

        // Trong BaseRepository.cs
        public async Task<(List<T> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize, Expression<Func<T, bool>>? predicate = null)
        {
            IQueryable<T> query = _dbSet;

            if (predicate != null)
                query = query.Where(predicate);

            int totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public virtual async Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }
    }
}
