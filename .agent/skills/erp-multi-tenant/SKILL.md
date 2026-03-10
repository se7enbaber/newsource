---
name: mint-erp-multi-tenant
description: Quy trình kiểm soát đa khách hàng (TenantId), Isolation qua Entity Framework Core Global Query Filter hoặc Connection Switch. Khắc phục lỗi data rò rỉ.
---

# Multi-Tenant Data Isolation

Dự án có cơ chế kiểm soát Tenant từ middleware cho tới Entity Framework DbContext.

## Các Pattern thực tế (Code Example)

### 1. Bật tính tự lọc Entity Framework (Global Query Filter)
Tất cả các bảng dùng chung (Shared schema) đều filter the `TenantId` nếu Model kế thừa `IMultiTenant` (`ApplicationDbContext.cs`).
```csharp
// ApplicationDbContext.cs
modelBuilder.Entity<ApplicationUser>().HasQueryFilter(u => u.TenantId == _tenantService.TenantId && !u.IsDeleted);
```

### 2. Tự động Set TenantId vào CSDL
Override lệnh `SaveChangesAsync` trong EF Core Context.
```csharp
// ApplicationDbContext.cs
if (entry.Entity is IMultiTenant tenantEntity && entry.State == EntityState.Added)
{
    if (tenantEntity.TenantId == Guid.Empty && currentTenantId.HasValue)
    {
        tenantEntity.TenantId = currentTenantId.Value;
    }
}
```

### 3. Dynamic Connection String (Isolation DB)
System config connection riêng lẻ mỗi Tenant cho phép dùng Database tách biệt: SQL Server, PostgreSQL, MySQL (`OnConfiguring`).
```csharp
var tenantProvider = scope.ServiceProvider.GetService<ITenantProvider>();
var connString = tenantProvider.GetConnectionString();
switch (provider?.ToLower()) { ... UseNpgsql / UseMySql / UseSqlServer ... }
```

---

## ✅ Checklist (Thêm Entity Multi-Tenant mới)
→ Chi tiết xem: new-tenant-entity-flow.md

---

## 🚫 Sai vs Đúng (Anti-Patterns)

| Sai (Anti-pattern) | Đúng |
|---|---|
| Dùng `[FromQuery] Guid tenantId` từ Request để search cho các object `WHERE tenantId == ...`. Rất dễ gây xâm cơ sở dữ liệu nếu lộ. | Middleware tự động bóc tách từ JWT token (`tenant_id` claim) hoặc host domain qua DI của TenantService . EF Core auto thêm `WHERE TenantId=...`. |
| Xóa record khỏi hệ thống vĩnh viễn (Hard Delete). | Implement `IAuditDeleteEntity` và để Auto Soft Delete chuyển cờ. |
| Lỗi tạo trùng tên (admin) qua các Tenant khác nhau do dính Unique Index hệ thống mặc định. | → Chi tiết xem: tenant-unique-index-antipattern.md |
