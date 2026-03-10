# Cấu hình Entity Multi-Tenant Mới

## Khi nào đọc file này
Chỉ đọc khi: Bổ sung một bảng CSDL mới (Entity) có dữ liệu phân chia theo từng khách hàng (Multi-Tenant).

## Tại sao phức tạp
Quy trình có sự phụ thuộc chặt chẽ với logic Global Query Filter của EF Core. Từng phát sinh lỗi mất dữ liệu khi quên ignore filter trong service chạy ngầm (Cron Jobs).

## Cấu hình Entity và Scheduler Flow
1. **Cập nhật Model**: Thêm property `public Guid TenantId { get; set; }` và khai báo kế thừa interface `IMultiTenant`.
2. **Khai báo Query Filter trong DbContext**: Mở `ApplicationDbContext`, tìm hàm `OnModelCreating` và thêm dòng lọc:
   ```csharp
   modelBuilder.Entity<NewModel>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && !x.IsDeleted);
   ```
3. **Đăng ký Dependency**: Đảm bảo `ITenantService` đã sẵn sàng để hệ thống tự lấy `TenantId` hiện hành.
4. **Migration CSDL**: Chạy lệnh EF CLI `dotnet ef migrations add <MigrationName>` để tạo thay đổi schema.
5. **Cảnh báo Flow Scheduler/Background Job**: 
   - **Mục rủi ro (Cảnh báo)**: Khi viết các service chạy ngầm bằng code hoặc Cron Jobs, do Thread không chạy dưới context HTTP request nên HTTP Context bị null -> `TenantId` có thể trống hoặc lấy sai.
   - **Cách xử lý Đúng**: Chủ động gọi hàm `IgnoreQueryFilters()` trên Entity. Nếu đang kế thừa `BaseRepository`, hãy gọi phương thức `_repository.GetAllIgnoreFilters()`.

## Liên quan
- Xem thêm: `mint-erp-multi-tenant`
