# Checklist khi tạo Module mới (Backend)

## Khi nào đọc file này
Chỉ đọc khi: Bắt đầu tạo một feature/module mới hoàn toàn ở backend yêu cầu có bảng CSDL mới.

## Tại sao phức tạp
Logic gồm 7 bước phân tán ở nhiều layer và dự án khác nhau (AdministrationService, ShareService), bắt buộc phải làm theo đúng thứ tự để không break build hoặc missing dependency.

## Các bước thực hiện
1. **Model/Entity**: 
   - Khai báo model trong `AdministrationService.Infrastructure.Model`. 
   - Nhớ kế thừa `IAuditDeleteEntity` và `IMultiTenant` nếu cần.
2. **Entity Framework**: 
   - Thêm `DbSet<T>` vào `ApplicationDbContext`.
   - Map table header bằng EF Fluent API: `modelBuilder.Entity<T>().ToTable($"{AppConstants.PrefixTable}TableName");`.
3. **Repository**: 
   - Tạo Interface kế thừa `IBaseRepository<T>`.
   - Tạo Class kế thừa `BaseRepository<T>`.
4. **DTO**: 
   - Khai báo class DTO trong `ShareService` dưới namespace tương ứng (hoặc thư mục con DTO).
5. **Service**: 
   - Tạo Interface kế thừa `IBaseService<TEntity, TDto, TCreateDto>`.
   - Tạo Class kế thừa `BaseService<TEntity, TDto, TCreateDto>`. 
   - Bắt buộc implement 2 hàm abstract: `MapToDto` và `MapToEntity`.
6. **Provider (DI)**: 
   - Register Dependency Injection (Scoped) trong `Program.cs` hoặc file `Extensions` tương ứng.
7. **Controller**: 
   - Tạo RESTful API Controller, inject Service interface vừa tạo.
   - Gắn attribute bảo mật `[HasPermission("...")]` vào các endpoint.

## Liên quan
- Xem thêm: `mint-erp-architecture-layer`
