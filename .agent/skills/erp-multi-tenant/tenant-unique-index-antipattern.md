# Lỗi Duplicate Unique Index Đa Khách Hàng

## Khi nào đọc file này
Chỉ đọc khi: Log backend báo lỗi exception về Database Unique Constraint hoặc không tạo mới được User (trùng lặp User/Role) ở các Tenant độc lập.

## Tại sao phức tạp
Là anti-pattern đặc thù (tiêu chí #1, #2). EF Identity tự động generate Unique Index cho `NormalizedUserName` hoặc `NormalizedEmail` trên phạm vi toàn cục. Khi áp dụng Multi-tenant, Index này gây lỗi trùng lặp khi 2 Tenant khác nhau cùng mở tài khoản chung tên.

## Chi tiết Anti-Pattern
- **Hiện tượng (Sai)**: Một người dùng đăng ký username "admin" ở Tenant A. Hệ thống báo lỗi "Cannot insert duplicate key row..." khi người dùng thứ hai tạo username "admin" ở Tenant B.
- **Giải pháp (Đúng)**: Cần thiết lập Override trong DbContext để định nghĩa Unique Index theo cụm kết hợp.
  - Hủy Index mặc định liên kết với column đó.
  - Tạo một Unique Index mới gộp chung column đó và `TenantId`.
  
```csharp
// ShareService/Data/ApplicationDbContext.cs
protected override void OnModelCreating(ModelBuilder builder)
{
    base.OnModelCreating(builder);

    builder.Entity<ApplicationUser>(b =>
    {
        // Xóa index cũ tự tạo của ASP.NET Core Identity
        b.HasIndex(u => u.NormalizedUserName).HasDatabaseName("UserNameIndex").IsUnique(false);
        
        // Thêm Index mới ghép cặp (NormalizedUserName + TenantId)
        b.HasIndex(u => new { u.NormalizedUserName, u.TenantId })
         .HasDatabaseName("TenantUserNameIndex")
         .IsUnique();
    });
}
```

## Liên quan
- Xem thêm: `mint-erp-multi-tenant`
