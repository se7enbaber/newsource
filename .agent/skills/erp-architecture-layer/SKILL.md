---
name: mint-erp-architecture-layer
description: Kiến trúc các layer Backend (Controller, Service, Repository) và cách kế thừa BaseService, BaseRepository. Dùng khi tạo module mới ở Backend. KHÔNG dùng khi viết code Frontend.
---

# Lớp Kiến trúc (Architecture Layer)

Dự án tuân thủ nghiêm ngặt mô hình Repository - Service Pattern.

## Các Pattern thực tế (Code Example)

### 1. Kế thừa BaseRepository
Mọi repository đều phải kế thừa từ `ShareService.Repositories.Base.BaseRepository<T>`.

```csharp
// ShareService/Repositories/Base/BaseRepository.cs
public class BaseRepository<T> : IBaseRepository<T> where T : class
{
    protected readonly DbContext _context;
    protected readonly DbSet<T> _dbSet;
    // ...
    public virtual IQueryable<T> Entities => _dbSet;
    public virtual IQueryable<T> GetAllIgnoreFilters() => _dbSet.IgnoreQueryFilters();
}
```

### 2. Kế thừa BaseService
Dịch vụ nghiệp vụ (Business Service) phải kế thừa từ `ShareService.Services.Base.BaseService<TEntity, TDto, TCreateDto>`. Hệ thống sẽ tự động map và gán `TenantId`.

```csharp
// ShareService/Services/Base/BaseService.cs
public abstract class BaseService<TEntity, TDto, TCreateDto>(
    IBaseRepository<TEntity> repository,
    ITenantService tenantService) : IBaseService<TEntity, TDto, TCreateDto>
{
    // ...
    public virtual async Task<TDto> CreateAsync(TCreateDto dto)
    {
        var entity = MapToEntity(dto);
        if (entity is IMultiTenant multiTenantEntity)
        {
            multiTenantEntity.TenantId = _tenantService.TenantId;
        }
        await _repository.AddAsync(entity);
        await _repository.SaveChangesAsync();
        return MapToDto(entity);
    }
}
```

---

## ✅ Checklist khi tạo Module mới (Backend)
→ Chi tiết xem: backend-module-checklist.md

---

## 🚫 Sai vs Đúng (Anti-Patterns)

| Sai (Anti-pattern) | Đúng |
|---|---|
| Khởi tạo `AppDbContext _context` trực tiếp trong Controller để query data. | Gọi Repositories thông qua lớp Service ở Controller. |
| Gọi `_context.Remove(entity)` để xóa vật lý dữ liệu (Hard-delete). | Gọi `_repository.Delete(entity)` để kích hoạt Soft Delete (IsDeleted = true). |
| Viết lặp lại hàm GetById, GetAll trên mọi service. | Kế thừa `BaseService<TEntity, TDto, TCreateDto>`. |

---

## Tham chiếu chéo (Cross-reference)
- Phân quyền (Permission): Xem skill `mint-erp-dynamic-permission` để biết cách bảo vệ Controller vừa tạo.
- Multi-tenant: Xem skill `mint-erp-multi-tenant` giải thích cơ chế `TenantId` tiêm ngầm định.
