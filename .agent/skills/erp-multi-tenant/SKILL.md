---
name: mint-erp-multi-tenant
description: Dùng khi cần hiểu hoặc implement logic liên quan đến multi-tenant: TenantId inject tự động, query filter cô lập data, isolated database per tenant, hoặc bypass filter trong các trường hợp đặc biệt. KHÔNG dùng khi câu hỏi chỉ liên quan đến AuthZ/Permission thuần túy.
---

# Multi-Tenant — Cơ chế cô lập dữ liệu

## Cơ chế hoạt động tổng thể

```text
Request → JWT (chứa tenant_id claim)
        → TenantService trích xuất tenant_id từ HttpContext
        → ApplicationDbContext nhận ITenantProvider qua DI
        → DbContextOptionsBuilder kiểm tra ConnectionString của Tenant
              ├── Có ConnectionString riêng → kết nối DB/Schema isolated
              └── Không có → dùng Shared DB + HasQueryFilter(TenantId)
```

Hệ thống hỗ trợ **2 chế độ cô lập** song song:

| Chế độ | Khi nào áp dụng | Cơ chế |
|--------|-----------------|--------|
| **Shared DB** | Tenant không có ConnectionString riêng | `HasQueryFilter(u => u.TenantId == tenantId)` tự động |
| **Isolated DB** | Tenant có ConnectionString riêng (MySQL / Postgres) | `DbContextOptionsBuilder` trỏ đến DB/Schema riêng biệt |

---

## Interface bắt buộc khi tạo Entity multi-tenant

Mọi entity cần cô lập theo tenant phải implement **`IMultiTenant`**:

```csharp
// ShareService/Interfaces/IMultiTenant.cs
public interface IMultiTenant
{
    Guid TenantId { get; set; }
}
```

Kết hợp với `IAuditDeleteEntity` khi cần Soft Delete:

```csharp
// AdministrationService.Infrastructure.Model
public class Invoice : IAuditDeleteEntity, IMultiTenant
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }   // ← bắt buộc, EF sẽ filter theo field này
    public string InvoiceNo { get; set; }
    // ...
    public bool IsDeleted { get; set; }  // từ IAuditDeleteEntity
}
```

> **Không implement `IMultiTenant`** → entity đó sẽ **không** bị filter theo tenant → tất cả tenant đều thấy toàn bộ dữ liệu. Chỉ dùng cho bảng Master data dùng chung (ví dụ: danh mục hệ thống, cấu hình global).

---

## TenantId được inject tự động — Không cần set thủ công

`BaseService` tự động gán `TenantId` khi `CreateAsync`:

```csharp
// ShareService/Services/Base/BaseService.cs
public virtual async Task<TDto> CreateAsync(TCreateDto dto)
{
    var entity = MapToEntity(dto);
    if (entity is IMultiTenant multiTenantEntity)
    {
        multiTenantEntity.TenantId = _tenantService.TenantId; // ← inject tự động
    }
    await _repository.AddAsync(entity);
    await _repository.SaveChangesAsync();
    return MapToDto(entity);
}
```

**Kết luận:** Nếu Service kế thừa `BaseService` + Entity implement `IMultiTenant` → **không bao giờ cần set TenantId thủ công** trong code nghiệp vụ.

---

## Global Query Filter — Cơ chế Shared DB

EF Core tự động đăng ký filter cho mọi entity implement `IMultiTenant`:

```csharp
// ApplicationDbContext — cấu hình Global Query Filter
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    foreach (var entityType in modelBuilder.Model.GetEntityTypes())
    {
        if (typeof(IMultiTenant).IsAssignableFrom(entityType.ClrType))
        {
            // Filter tự động — mọi query đều bị giới hạn theo TenantId hiện tại
            modelBuilder.Entity(entityType.ClrType)
                .HasQueryFilter(e => EF.Property<Guid>(e, "TenantId") == _tenantProvider.TenantId);
        }
    }
}
```

Điều này có nghĩa: mọi câu lệnh `_repository.Entities` đã **ngầm định** có `WHERE TenantId = @currentTenantId`.

---

## Khi nào dùng `IgnoreQueryFilters()`

`GetAllIgnoreFilters()` từ `BaseRepository` chỉ dùng trong **3 trường hợp hợp lệ**:

| Trường hợp | Ví dụ |
|------------|-------|
| Super Admin cần xem toàn bộ data xuyên tenant | Dashboard tổng hợp hệ thống |
| Background Job (Hangfire) quét tất cả tenant | Migration job, cleanup job |
| Tìm kiếm Tenant record trên Master DB | `TenantService` tra cứu ConnectionString |

```csharp
// ✅ Đúng — Hangfire job quét toàn bộ tenant
var allTenants = _tenantRepository.GetAllIgnoreFilters().ToList();

// ❌ Sai — dùng trong API endpoint thông thường
var invoices = _invoiceRepository.GetAllIgnoreFilters(); // lộ data chéo tenant!
```

> **Quy tắc:** Mọi chỗ dùng `IgnoreQueryFilters()` phải có comment giải thích lý do. Nếu không có lý do rõ ràng → không dùng.

---

## Map Entity vào EF với prefix bảng chuẩn

```csharp
// ApplicationDbContext — OnModelCreating
modelBuilder.Entity<Invoice>().ToTable($"{AppConstants.PrefixTable}invoices");
// Kết quả: tên bảng sẽ là "mt_invoices" (hoặc prefix tương ứng của project)
```

---

## Isolated DB per Tenant — Luồng kết nối

Khi Tenant có ConnectionString riêng trong Master DB:

```text
Request với tenant_id → TenantService.GetConnectionStringAsync(tenantId)
                      → Tìm trong bảng mt_tenants (Master Postgres)
                      → Có ConnectionString riêng?
                            ├── Yes → DbContextOptionsBuilder.UseNpgsql(connStr)
                            │         hoặc .UseMySql(connStr)   ← hỗ trợ cả MySQL
                            └── No  → Dùng Master DB + HasQueryFilter
```

Dev **không cần xử lý logic này thủ công** — `ITenantProvider` + `ApplicationDbContext` tự handle.

---

## Sai vs Đúng (Anti-patterns)

| Sai | Đúng |
|-----|------|
| Set `entity.TenantId = ...` thủ công trong Service | Kế thừa `BaseService` — inject tự động |
| Dùng `GetAllIgnoreFilters()` trong API endpoint bình thường | Chỉ dùng trong Super Admin / Background Job |
| Tạo Entity không implement `IMultiTenant` cho data cần cô lập | Luôn implement `IMultiTenant` nếu data thuộc về Tenant |
| Query `_context.Invoices` trực tiếp trong Controller | Gọi qua Repository → Service (filter đã được áp tự động) |
| Hardcode `WHERE TenantId = ...` trong query | Để EF Global Query Filter tự xử lý |

---

## Checklist khi tạo Entity mới — Multi-tenant

```
[ ] Entity có implement IMultiTenant không?
      → Nếu data thuộc về Tenant: BẮT BUỘC implement
      → Nếu là Master data dùng chung: KHÔNG implement
[ ] ToTable() đã dùng AppConstants.PrefixTable chưa?
[ ] Service kế thừa BaseService để TenantId được inject tự động?
[ ] Có chỗ nào dùng IgnoreQueryFilters() không cần thiết không?
```

---

## Tham chiếu chéo (Cross-reference)
- Tạo module mới: `backend-module-checklist` — bước 1 (Entity) phải quyết định implement `IMultiTenant` hay không.
- Kiến trúc layer: `mint-erp-architecture-layer` — `BaseService` và `BaseRepository` là nơi inject TenantId và áp filter.
- Phân quyền: `mint-erp-dynamic-permission` — Permission cũng được kiểm tra trong scope Tenant hiện tại.