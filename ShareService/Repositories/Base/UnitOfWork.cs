using Microsoft.EntityFrameworkCore;
using System.Collections;

namespace ShareService.Repositories.Base
{
    public interface IUnitOfWork : IDisposable
    {
        IBaseRepository<T> Repository<T>() where T : class;
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
    public class UnitOfWork : IUnitOfWork
    {
        private readonly DbContext _context;
        private Hashtable? _repositories;
        private bool _disposed = false;

        public UnitOfWork(DbContext context)
        {
            _context = context;
        }

        public IBaseRepository<T> Repository<T>() where T : class
        {
            if (_repositories == null) _repositories = new Hashtable();

            var type = typeof(T).Name;

            if (!_repositories.ContainsKey(type))
            {
                var repositoryType = typeof(BaseRepository<>);
                var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(T)), _context);
                _repositories.Add(type, repositoryInstance);
            }

            return (IBaseRepository<T>)_repositories[type]!;
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // Gọi xuống ApplicationDbContext (Nơi có logic Auto-Audit/Tenant)
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task BeginTransactionAsync() => await _context.Database.BeginTransactionAsync();

        public async Task CommitTransactionAsync() => await _context.Database.CommitTransactionAsync();

        public async Task RollbackTransactionAsync() => await _context.Database.RollbackTransactionAsync();
        // Hàm Dispose công khai
        public void Dispose()
        {
            Dispose(true);
            // Ngăn GC gọi hàm hủy, giúp giải phóng RAM nhanh hơn
            GC.SuppressFinalize(this);
        }
        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    // Dọn dẹp tài nguyên quản lý (managed resources)
                    _context.Dispose();
                }
                _disposed = true;
            }
        }
        
        // Hàm hủy (Finalizer) - Phòng hờ trường hợp Dev quên gọi Dispose()
        ~UnitOfWork()
        {
            Dispose(false);
        }
    }
}
