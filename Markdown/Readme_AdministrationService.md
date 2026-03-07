# Administration Service — Tài liệu Kỹ thuật Chi tiết

> **Ghi chú:** Đây là file chứa thông tin kỹ thuật chuyên sâu dành riêng cho Backend (API). Đối với thông tin tổng quan về cách kết nối hệ thống, vui lòng tham khảo [README.md chính ở thư mục gốc](../README.md).

> **Ngày cập nhật:** 2026-03-04  
> **Stack:** .NET 10 · ASP.NET Core Identity · OpenIddict · Entity Framework Core · Multi-tenant

---

## Mục lục
1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Luồng xử lý chính](#2-luồng-xử-lý-chính)
3. [Chi tiết từng file](#3-chi-tiết-từng-file)
   - [Program.cs](#programcs)
   - [Worker/DbSeeder.cs](#workerdbseedercs)
   - [Extensions/](#extensions)
   - [Providers/TenantProvider.cs](#providerstenantprovidercs)
   - [Services/TenantService.cs](#servicestenantservicecs)
   - [ShareService/Infrastructure/Model/Base/](#shareserviceinfrastructuremodelbase)
   - [Infrastructure/Data/ApplicationDbContext.cs](#infrastructuredataapplicationdbcontextcs)
   - [ShareService/Repositories/Base/](#shareservicerepositoriesbase)
   - [ShareService/Services/Base/BaseService.cs](#shareserviceservicesbasebaseservicecs)
   - [Services/Roles/RoleService.cs](#servicesrolesroleservicecs)
   - [Services/Users/UserService.cs](#servicesusersuserservicecs)
   - [Services/tenants/TenantAppService.cs](#servicestenantappservicecs)
   - [Controllers/](#controllers)
4. [Vấn đề Multi-tenant & Global Query Filter](#4-vấn-đề-multi-tenant--global-query-filter)
5. [Hệ thống Phân quyền Động (Dynamic Permissions)](#5-hệ-thống-phân-quyền-động-dynamic-permissions)
6. [Lỗi thường gặp & Debug Checklist](#6-lỗi-thường-gặp--debug-checklist)

---

## 1. Tổng quan kiến trúc

```text
┌──────────────────────────────────────────────────────┐
│                     HTTP Request                     │
└──────────────────────┬───────────────────────────────┘
                       │ JWT (có claim: tenant_id, roles)
                       ▼
┌──────────────────────────────────────────────────────┐
│  Middleware Pipeline (Program.cs)                    │
│  → Authentication → TenantService.TenantId ← claim   │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
  ┌──────────────┐         ┌─────────────────┐
  │ Controllers  │         │ Auth Controller │
  │ (Users/Roles)│         │ /connect/token  │
  └──────┬───────┘         └────────┬────────┘
         │                          │
         ▼                          ▼
  ┌──────────────┐         ┌─────────────────┐
  │   Services   │         │  OpenIddict     │
  │ (User/Role)  │         │  (JWT Issuer)   │
  └──────┬───────┘         └─────────────────┘
         │
         │   REST HTTP     ┌─────────────────┐
         ├────────────────►│ SignalR Service │
         │   (POST)        │ (WebSocket Push)│
         ▼                 └─────────────────┘
  ┌──────────────┐
  │ Repositories │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │  ApplicationDbContext            │
  │  + Global Query Filter (Tenant)  │
  │  + Soft Delete (IsDeleted)       │
  │  + Auto Audit (CreatedAt...)     │
  └──────────────────────────────────┘
         │
         ▼
  ┌──────────────┐
  │   Database   │
  │ (PostgreSQL  │
  │ /SqlServer / │
  │   MySql)     │
  └──────────────┘
```

---

## 2. Luồng xử lý chính

### Đăng nhập (POST `/connect/token`)
1. Client gửi `username`, `password`, `tenant` (mã hoặc tên tenant).
2. `AuthorizationController` uppercase `tenantCode` phía .NET (`ToUpperInvariant()`) trước khi query → PostgreSQL có thể dùng index thay vì full table scan.
3. Khởi tạo một **DI Scope riêng biệt** để cấp phát `ApplicationDbContext` và `UserManager` trỏ đến chuỗi kết nối (Connection String) riêng của Tenant (nếu Tenant chạy Isolation Database).
4. Tìm `User` thuộc đúng Tenant (bypass Global Filter bằng `IgnoreQueryFilters()`).
5. Xác thực mật khẩu qua `SignInManager`.
6. **Song song hóa** bằng `Task.WhenAll`: query Roles và TenantFeatures cùng lúc → giảm ~40-60% thời gian round-trip DB.
7. Đóng gói các claim (`tenant_id`, `tenant_conn`, `tenant_provider`, `roles`, `Permission`, `Feature`...) vào JWT.<br/>- Admin role: **không nạp Permission** vào JWT (giảm token bloat), handler tự bypass.
8. OpenIddict trả về Access Token.

### Mọi request sau đó
1. ASP.NET Core xác thực JWT, parse claim.
2. Middleware trong `Program.cs` đọc claim `tenant_id` và set vào `TenantService.TenantId`.
3. `ApplicationDbContext` tự động lọc mọi query theo `TenantId` (Global Query Filter).

---

## 3. Chi tiết từng file

---

### `Program.cs`

**Vai trò:** Điểm khởi động của ứng dụng. Đăng ký tất cả dịch vụ và cấu hình middleware pipeline.

**Vận hành:**

| Bước | Mô tả |
|------|-------|
| 1 | Đăng ký `ApplicationDbContext` với provider động (PostgreSQL/SqlServer/MySql) đọc từ `appsettings.json`. |
| 2 | Gọi `AddInfrastructureServices()` để tự động đăng ký tất cả Repository và Service. |
| 3 | Cấu hình ASP.NET Core Identity với `ApplicationUser` và `ApplicationRole`. |
| 4 | Cấu hình OpenIddict: endpoint `/connect/token`, hỗ trợ Password Flow. |
| 5 | Cấu hình **Hangfire**: Sử dụng PostgreSQL storage và kích hoạt **Hangfire.Console** để log dashboard. |
| 6 | Đăng ký `DbSeeder` như một `IHostedService` — chạy tự động lúc startup. |
| 7 | **Hangfire Dashboard**: Cấu hình tại `/hangfire` với Authorization Filter tùy chỉnh cho phép truy cập qua Gateway. |
| 8 | Middleware đọc claim `tenant_id` từ JWT đã được parse, set vào `TenantService` (Scoped). |
| 9 | Môi trường Development/Docker: tự động chạy `ApplyMigrationsAsync()`. |

> ⚠️ **Lưu ý:** Middleware set `TenantId` nằm **sau** `UseAuthentication()` để JWT đã được parse trước khi đọc claim.

---

### `Worker/DbSeeder.cs`

**Vai trò:** `IHostedService` chạy một lần duy nhất khi ứng dụng khởi động, khởi tạo dữ liệu mặc định.

**Vận hành (2 scope riêng biệt):**

#### Scope 1 — Khởi tạo hạ tầng
```
EnsureCreatedAsync()                         ← Tạo DB nếu chưa có
  ↓
Tạo OpenIddict Client "swagger"              ← Cho phép Swagger lấy token
  ↓
Kiểm tra Tenants.AnyAsync()
  → Nếu chưa có:
    Tạo Tenant "admin" → SaveChanges()       ← PHẢI save trước khi tạo Role (FK!)
    roleManager.RoleExistsAsync("Admin")     ← Kiểm tra tránh duplicate
    roleManager.CreateAsync(role)            ← Tạo Role thông qua RoleManager
                                             ← (Scope 1 có HTTP context giả, TenantId được gán xác định)
```

> ✅ **Vì sao Scope 1 dùng được `RoleManager`?** Khi tạo Role trong Scope 1, `TenantId` được gán trực tiếp vào entity `ApplicationRole` trước khi tạo, nên không bị lỗi filter. Lỗi chỉ xảy ra khi **tìm kiếm** Role qua RoleManager mà không có TenantId context.

#### Scope 2 — Tạo User admin
```
Đọc lại Tenant "admin" từ DB
  ↓
Kiểm tra user "admin" đã tồn tại chưa (IgnoreQueryFilters + lọc TenantId)
  ↓
Tạo ApplicationUser với TenantId, password
  ↓
Tìm Role "ADMIN" bằng IgnoreQueryFilters() + lọc TenantId thủ công
  ↓
Insert thẳng vào bảng UserRoles (bypass RoleManager bị filter)
  ↓
SaveChangesAsync()
```

> ⚠️ **Vì sao dùng 2 scope?** Scope 1 đóng lại trước để EF Core thực sự commit dữ liệu. Scope 2 tạo mới để đảm bảo Identity Manager đọc lại trạng thái DB mới nhất.

> ⚠️ **Vì sao không dùng `AddToRoleAsync`?** Vì `RoleManager` bị `Global Query Filter` lọc theo `TenantId`. Khi seed (không có HTTP request), `TenantId = Guid.Empty` → không tìm thấy Role. Giải pháp: insert thẳng vào `IdentityUserRole<Guid>`.

---

### `Extensions/`

#### `AppConstants.cs`
Định nghĩa các hằng số dùng chung:
- `PrefixTable = "ADMIN_"` — tiền tố cho tên tất cả các bảng DB (ví dụ: `ADMIN_Users`, `ADMIN_Roles`).

#### `DependencyInjection.cs`
**Vai trò:** Auto-registration tất cả Services và Repositories bằng Reflection.

**Vận hành:**
```
Quét toàn bộ Assembly
  → Tìm class public, không abstract, tên kết thúc bằng "Repository" hoặc "Service"
  → Ghép với Interface tương ứng (IXxxRepository ↔ XxxRepository)
  → Đăng ký Scoped vào DI container
```
Nhờ đây, mọi lớp như `UserService`, `RoleService`, `UserRepository`, `RoleRepository` đều được đăng ký tự động mà không cần khai báo thủ công.

#### `MigrationExtensions.cs`
**Vai trò:** Extension method `ApplyMigrationsAsync()` — tự động chạy các pending migration khi khởi động ở môi trường Development, tương đương lệnh `dotnet ef database update`.

---

### `Providers/TenantProvider.cs`

**Vai trò:** Đọc thông tin Tenant từ JWT claims để cấu hình kết nối DB động.

**Vận hành:**
```
HTTP Request có JWT
  → TenantProvider.GetTenantId()       ← đọc claim "tenant_id"
  → TenantProvider.GetConnectionString()  ← đọc claim "tenant_conn" (nếu có)
  → TenantProvider.GetDbProvider()     ← đọc claim "tenant_provider"
```

Dữ liệu này được `ApplicationDbContext.OnConfiguring()` sử dụng để **kết nối đúng database của Tenant** (mỗi Tenant có thể có DB riêng).

---

### `Services/TenantService.cs`

**Vai trò:** Lưu trữ `TenantId` hiện tại trong phạm vi một request (Scoped).

```csharp
public interface ITenantService { Guid TenantId { get; set; } }
public class TenantService : ITenantService { public Guid TenantId { get; set; } }
```

- `TenantId` được gán bởi middleware trong `Program.cs` sau khi parse JWT.
- `ApplicationDbContext` đọc `TenantId` này từ `ITenantService` để áp dụng Global Query Filter.
- Khi không có JWT (ví dụ lúc Seed), `TenantId = Guid.Empty`.

---

### `Infrastructure/Model/`

#### `ApplicationUser.cs`
Mở rộng `IdentityUser<Guid>` với các trường:

| Nhóm | Trường |
|------|--------|
| **Multi-tenant** | `TenantId` |
| **Audit** | `CreatedAt`, `CreatedBy`, `CreatedId`, `UpdatedAt`, `UpdatedBy`, `UpdatedId` |
| **Soft Delete** | `IsDeleted`, `DeletedAt`, `DeletedBy`, `DeletedId` |
| **Thông tin cá nhân** | `FullName`, `DateOfBirth`, `AvatarUrl`, `AvatarJsonConfig` |
| **Trạng thái** | `IsActive`, `IsEmailVerified` |

#### `ApplicationRole.cs`
Mở rộng `IdentityRole<Guid>` với:
- `TenantId` — gắn Role vào Tenant cụ thể.
- `Description` — mô tả Role để hiện trong dropdown.
- `IsSystemRole` — Role hệ thống, không cho phép xóa.
- `IsActive`, các trường Audit và Soft Delete tương tự User.

#### `Tenant.cs`
Model tổ chức (Tenant):
- `Code` — mã định danh ngắn (ví dụ: `"admin"`, `"apple"`), có **Unique Index**.
- `ConnectionString` — chuỗi kết nối DB riêng (nếu Tenant dùng DB tách biệt).
- `DbProvider` — loại database (`"postgresql"`, `"sqlserver"`, `"mysql"`).
- `IsMigrated` và `LastMigratedAt` — kiểm soát trạng thái Update DB qua quá trình Seed.
- **Features** — Quản lý trong bảng riêng `TenantFeatures` (quan hệ N-N).
- Đầy đủ Audit + Soft Delete.

#### `ShareService/Infrastructure/Model/Base/` (IAuditEntity.cs & IMultiTenant.cs)
Các interface chuẩn:
- `IAuditEntity` — cung cấp các trường `CreatedAt`, `UpdatedAt`, v.v.
- `IAuditDeleteEntity` — bổ sung Soft Delete (`IsDeleted`, `DeletedAt`, ...).
- `IMultiTenant` — yêu cầu trường `TenantId`.

#### `Model/DTOs/`
- **`UserDto`** — kế thừa `CreateUserDto`, bổ sung thêm `Id: Guid`.
- **`CreateUserDto`** — payload tạo/cập nhật user: `UserName`, `FullName`, `Email`, `Password`, `PhoneNumber`, `DateOfBirth`, `IsActive`, `AvatarUrl`, `Roles: List<string>` (danh sách tên role để gán).
- **`RoleDto`** — kế thừa `CreateRoleDto`, hiện tại **chỉ có trường `Name`** (không có `Id`). Do đó dropdown API cũng chỉ trả về `name`, frontend phải dùng `name` làm identifier khi tạo/sửa user.
- **`CreateRoleDto`** — payload tạo/cập nhật role: `Name`.
- **`AssignRoleDto`** — DTO phụ trợ: `UserId`, `RoleName` (dùng cho các tình huống gán role riêng lẻ).
- **`PaginationDto`** — `PaginationParams` (PageNumber, PageSize, SearchTerm) và `PagedResult<T>`.

---

### `Infrastructure/Data/ApplicationDbContext.cs`

**Vai trò:** Trung tâm dữ liệu — quản lý kết nối DB, áp dụng filter và tự động Audit.

**3 tính năng cốt lõi:**

#### A. Global Query Filter (Multi-tenant + Soft Delete)
```csharp
// Mọi query vào User/Role tự động thêm điều kiện WHERE
modelBuilder.Entity<ApplicationUser>()
    .HasQueryFilter(u => u.TenantId == _tenantService.TenantId && !u.IsDeleted);
modelBuilder.Entity<ApplicationRole>()
    .HasQueryFilter(u => u.TenantId == _tenantService.TenantId && !u.IsDeleted);
```
→ Developer không cần nhớ thêm điều kiện Tenant vào từng query.

#### B. Dynamic Connection String (`OnConfiguring`)
```
TenantProvider.GetConnectionString() → có giá trị?
  → YES: kết nối DB riêng của Tenant
  → NO:  dùng DefaultConnection (DB chung)
```
→ Mỗi Tenant có thể có DB tách biệt hoàn toàn.

#### C. Auto Audit & Soft Delete (`SaveChangesAsync` override)
Trước khi lưu, duyệt qua tất cả entity đang thay đổi:
- **Added** + `IAuditEntity` → điền `CreatedAt`, `CreatedBy`, `CreatedId`.
- **Modified** + `IAuditEntity` → điền `UpdatedAt`, `UpdatedBy`, `UpdatedId`.
- **Deleted** + `IAuditDeleteEntity` → **KHÔNG xóa thật**, chuyển thành Modified với `IsDeleted = true`.
- **Added** + `IMultiTenant` + `TenantId == Guid.Empty` → tự động điền `TenantId` từ claim.

---

### `ShareService/Repositories/Base/`

#### `BaseRepository<T>.cs`
Repository generic dùng cho mọi entity:

| Method | Mô tả |
|--------|-------|
| `Entities` | `IQueryable<T>` — áp dụng Global Filter |
| `GetByIdAsync(id)` | Tìm theo PK |
| `GetAllAsync()` | Lấy tất cả (có filter) |
| `AddAsync(entity)` | Thêm mới vào DbSet |
| `Update(entity)` | Đánh dấu Modified |
| `Delete(entity)` | Soft Delete (nhờ `SaveChangesAsync` xử lý) |
| `GetAllIgnoreFilters()` | Bypass Global Filter — dùng cho Admin xem chéo |
| `GetPagedAsync(page, size, predicate)` | Phân trang + lọc động |

#### `UnitOfWork.cs`
**Vai trò:** Quản lý transaction và chia sẻ một `DbContext` duy nhất giữa nhiều Repository trong cùng một request.

- `Repository<T>()` — lấy hoặc tạo mới `BaseRepository<T>` theo type, cache trong `Hashtable`.
- `BeginTransactionAsync()` / `CommitTransactionAsync()` / `RollbackTransactionAsync()` — bọc nhiều thao tác DB trong một transaction.
- Implement `IDisposable` đúng chuẩn với Finalizer dự phòng.

---

### `ShareService/Services/Base/BaseService.cs`

**Vai trò:** Service abstract generic, cung cấp CRUD cơ bản cho mọi entity.

**Vận hành của từng method:**

| Method | Vận hành |
|--------|--------|
| `GetAllAsync()` | Gọi Repository → map sang DTO |
| `GetByIdAsync(id)` | Gọi Repository → map sang DTO, trả `null` nếu không tìm thấy |
| `CreateAsync(dto)` | `MapToEntity` → tự gán `TenantId` nếu implement `IMultiTenant` → `AddAsync` → `SaveChanges` |
| `DeleteAsync(id)` | Tìm entity → `Delete()` (trở thành Soft Delete) → `SaveChanges` |
| `GetPagedAsync(page, size)` | Lấy dữ liệu phân trang (Items + TotalCount) |
| `UpdateAsync(id, dto)` | **Abstract** — bắt buộc subclass override |

Các method `MapToDto` và `MapToEntity` là **abstract** — mỗi Service con phải tự định nghĩa cách chuyển đổi.

---

### `Services/Roles/RoleService.cs`

**Vai trò:** Quản lý CRUD cho `ApplicationRole`, kế thừa `BaseService`.

**Điểm đặc biệt:**

- **`CreateAsync`**: Dùng `RoleManager.CreateAsync()` thay vì Repository thông thường để đảm bảo `NormalizedName` được xử lý đúng bởi Identity.
- **`UpdateAsync`**: Tương tự, dùng `RoleManager.UpdateAsync()`.
- **`GetPagedRolesAsync`**: Hỗ trợ phân trang + tìm kiếm theo tên Role.
- **`GetRolesForDropdownAsync`**: Chỉ lấy các Role `IsActive = true` của Tenant hiện tại.
- **`UpdateAsync`**: Xử lý cập nhật thông tin Role bao gồm `Description`, `IsActive` và `IsSystemRole`.
- **Mapping DTO**: `RoleDto` đã được mở rộng để bao gồm đầy đủ thông tin về trạng thái và loại vai trò.

> ✅ `RoleService` **không bị lỗi filter** vì khi dùng qua API, Tenant context đã được set đầy đủ từ JWT.

---

### `Services/Users/UserService.cs`

**Vai trò:** Quản lý CRUD cho `ApplicationUser`, kế thừa `BaseService`.

**Phương thức quan trọng:**

#### `CreateAsync(dto)` — Override từ BaseService
```
MapToEntity(dto)                              ← Tạo ApplicationUser object
  ↓
userManager.FindByNameAsync(userName)         ← Kiểm tra user đã tồn tại?
  → Chưa tồn tại:
      userManager.CreateAsync(user, password) ← Identity hash password, lưu user
      Nếu thất bại → throw Exception (kèm danh sách lỗi)
  → Đã tồn tại:
      user = userExist                        ← Dùng entity DB (có Id hợp lệ), bỏ object mới
  ↓
AssignRolesAsync(user.Id, user.TenantId, dto.Roles) ← Gán Role (bypass filter)
```

> ⚠️ **Lưu ý:** Phải dùng `user.Id` từ DB (sau `CreateAsync` hoặc từ `userExist`), không dùng Id từ object mới tạo trước khi gọi `CreateAsync` (lúc đó `Id = Guid.Empty`).

#### `UpdateAsync(id, dto)` — Thứ tự quan trọng
```
FindByIdAsync(id)                      ← Tìm user (Global Filter tự lọc Tenant)
  ↓
Cập nhật đầy đủ các field:
  Email, NormalizedEmail
  FullName, PhoneNumber, DateOfBirth
  IsActive, AvatarUrl
  UserName / NormalizedUserName (nếu thay đổi)
  ↓
userManager.UpdateAsync(user)          ← Lưu thông tin user TRƯỚC
  Nếu thất bại → return false ngay
  ↓
Xóa toàn bộ UserRoles cũ              ← Thao tác thẳng trên bảng join
  → context.SaveChangesAsync()         ← Save DELETE TRƯỚC (tránh EF conflict)
  ↓
AssignRolesAsync(...)                  ← Thêm Role mới (bypass filter)
                                         có SaveChangesAsync() bên trong
  ↓
[Nếu có password mới] RemovePassword → AddPassword
```

> ⚠️ **Tại sao phải `UpdateAsync` trước rồi mới xử lý Role?**  
> Nếu gọi `AssignRolesAsync` (có `SaveChangesAsync` bên trong) **trước** `UpdateAsync`, EF sẽ commit role changes nhưng user entity vẫn ở trạng thái `Modified` chưa được save → có thể gây conflict hoặc mất thay đổi user.

> ⚠️ **Tại sao phải `SaveChangesAsync` sau khi xóa roles, TRƯỚC khi thêm roles mới?**  
> Nếu `RemoveRange` và sau đó `AssignRolesAsync` (cũng `SaveChangesAsync`) chạy trong cùng một lượt, EF Change Tracker có thể cố gắng delete + insert cùng một `(UserId, RoleId)` trong một transaction → vi phạm constraint hoặc noop.

#### `AssignRolesAsync(userId, tenantId, roleNames)` — Hàm trợ giúp cốt lõi
```
Normalize tên role → ["admin"] thành ["ADMIN"]
  ↓
context.Roles.IgnoreQueryFilters()         ← Bypass Global Filter
  .Where(NormalizedName ∈ list AND TenantId == tenantId)  ← Lọc đúng Tenant thủ công
  ↓
Với mỗi Role tìm được:
  → Kiểm tra duplicate trong UserRoles (AnyAsync)
  → Nếu chưa có: context.Set<IdentityUserRole<Guid>>().Add(...)
  ↓
context.SaveChangesAsync()
```

#### `GetPagedUsersAsync(params)`
- Hỗ trợ tìm kiếm theo `UserName` hoặc `Email`.
- Với mỗi user trong kết quả: dùng `userManager.Users.IgnoreQueryFilters()` để tìm lại user theo `NormalizedUserName`, sau đó gọi `GetRolesAsync()` lấy danh sách role.

> ⚠️ **Tại sao phải `IgnoreQueryFilters()` khi lấy roles trong `GetPagedUsersAsync`?**  
> `userManager.GetRolesAsync()` nội bộ truy vấn qua `UserRoles` join `Roles` — nếu Global Filter đang hoạt động mà user đang được xử lý trong một context không có TenantId phù hợp (ví dụ user đã map từ kết quả paged), query sẽ không tìm thấy Role. `IgnoreQueryFilters()` bypass vấn đề này và trả về đúng Role.

#### `ResetPasswordAsync(userId, newPassword)`
- Dùng cơ chế token reset của Identity (an toàn hơn xóa/thêm password trực tiếp).

#### `Services/tenants/TenantAppService.cs`
**ITenantAppService** kế thừa từ `IBaseService<Tenant, TenantDto, CreateTenantDto>`.
- **Phân biệt:** `ITenantAppService` dùng để quản lý thực thể Tenant (CRUD trên giao diện cho Host Admin), còn `ITenantService` (thực thi qua `TenantService.cs`) dùng để lưu trữ `TenantId` trong Scope của Request hiện tại (Context).
- **Quản lý Features:** Service này chịu trách nhiệm gọi `UpdateFeaturesAsync` của Repository để đồng bộ danh sách Features vào bảng `TenantFeatures` mỗi khi tạo hoặc cập nhật Tenant.

---

### `Controllers/`

#### `AuthorizationController.cs` — `POST /connect/token`

**Luồng (sau refactor 2026-03-04):**
```
Nhận: username, password, tenant (mã hoặc tên hiển thị)
  ↓
Uppercase tenantCode phía .NET (ToUpperInvariant()) → query DB với hằng số
  → PostgreSQL có thể dùng index: t.Code.ToUpper() == tenantCodeUpper
Nếu không thấy Tenant → Báo lỗi.
  ↓
[Isolated Database Handling]
  Khởi tạo DI Scope hoàn toàn mới cho request hiện tại.
  Nếu Tenant có ConnectionString riêng → scopedContext.Database.SetConnectionString(...)
  ↓
Tìm User với IgnoreQueryFilters():
  WHERE NormalizedUserName = ToUpperInvariant(username) AND TenantId = ?
  ↓
CheckPasswordSignInAsync()
  ↓
Tạo ClaimsIdentity → thêm các claim cơ bản (subject, name, tenant_*)
  ↓
[Song song — Task.WhenAll]
  rolesTask        = Query UserRoles JOIN Roles, IgnoreQueryFilters()
  tenantFeatureTask = Query TenantFeatures theo TenantId
  ↓
ForEach role:
  → Gán Role claim vào JWT
  → isAdmin = true nếu role == "Admin" (SKIP nạp permission để giảm token bloat)
  → Cache hit "permissions_{TenantId}_{RoleName}" → dùng ngay (không gọi DB)
  → Cache miss → query RoleClaims, set cache 1 giờ
if (!isAdmin) → ghi Permission claims vào JWT
ForEach feature → ghi Feature claim vào JWT
  ↓
SignIn → OpenIddict phát hành JWT
```

**Tối ưu hiệu năng:**
| Thay đổi | Tác động |
|---|---|
| `ToUpperInvariant()` phía .NET thay vì trong DB expression | PostgreSQL dùng được index, tránh full scan |
| `Task.WhenAll(rolesTask, tenantFeaturesTask)` | Giảm ~40-60% thời gian DB khi không có cache miss |
| Skip Permission cho Admin | Giảm kích thước JWT, tăng tốc sign |
| Xóa `Console.WriteLine` debug | Không còn I/O dư thừa mỗi lần login |

#### `UsersController.cs` — `api/users`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users?pageNumber=1&pageSize=10&searchTerm=` | Danh sách phân trang |
| GET | `/api/users/{id}` | Chi tiết một user |
| POST | `/api/users` | Tạo mới user (kèm Roles) |
| PUT | `/api/users/{id}` | Cập nhật user + đồng bộ Roles |
| POST | `/api/users/{id}/reset-password` | Admin reset mật khẩu |
| DELETE | `/api/users/{id}` | Soft delete user |

Tất cả endpoint yêu cầu `[Authorize]` — JWT hợp lệ.

**Response của `PUT /api/users/{id}`:**
- `200 OK` — Cập nhật thành công
- `404 Not Found` — Không tìm thấy user (sai Id hoặc khác Tenant)
- `400 Bad Request` — Exception với `{ message, detail }` — chi tiết lỗi để debug

#### `RolesController.cs` — `api/roles`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/roles?pageNumber=1&pageSize=10` | Danh sách phân trang |
| GET | `/api/roles/{id}` | Chi tiết một role |
| GET | `/api/roles/get_role_dropdown` | Danh sách dropdown (chỉ Active) |
| POST | `/api/roles` | Tạo mới role |
| PUT | `/api/roles/{id}` | Cập nhật role |
| DELETE | `/api/roles/{id}` | Xóa role (nếu không có user đang dùng) |

#### `TenantsController.cs` — `api/tenants`
Quản lý các Tenant và Features liên quan (Dành cho Host Administrator).

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/tenants` | Danh sách phân trang Tenants |
| GET | `/api/tenants/{id}` | Chi tiết Tenant kèm danh sách Features |
| POST | `/api/tenants` | Tạo mới Tenant và gán Features ban đầu |
| PUT | `/api/tenants/{id}` | Cập nhật thông tin Tenant và đồng bộ Features |
| DELETE | `/api/tenants/{id}` | Soft delete Tenant |
| GET | `/api/tenants/get_features` | Lấy danh sách tất cả các mã Feature có trong hệ thống |

---

## 4. Vấn đề Multi-tenant & Global Query Filter

### 4.1. Ghi đè chỉ mục (Identity Index Overriding)
Mặc định, ASP.NET Core Identity tạo các Unique Index trên thuộc tính `NormalizedUserName` (User) và `NormalizedName` (Role). Điều này gây lỗi `duplicate key value` khi có hai Tenant khác nhau muốn dùng chung một username (vd: `admin`) hoặc chung một role name (vd: `Admin`).

**Giải pháp đã triển khai:**
Trong `ApplicationDbContext.cs`, we đã can thiệp vào `OnModelCreating` để:
1. Gỡ bỏ (`RemoveIndex`) các chỉ mục mặc định của Identity.
2. Thiết lập chỉ mục mới bao gồm cả `TenantId`:
   - `UserNameIndex(NormalizedUserName, TenantId)` (Unique).
   - `RoleNameIndex(NormalizedName, TenantId)` (Unique).

Việc này đảm bảo tính duy nhất của tài khoản/vai trò chỉ nằm trong phạm vi của một Tenant cụ thể.

### 4.2. Nguyên nhân lỗi "Role does not exist"

```
RoleManager.AddToRoleAsync("Admin")
  → Nội bộ gọi: context.Roles.Where(r => r.NormalizedName == "ADMIN")
  → Global Filter tự động thêm: AND r.TenantId == _tenantService.TenantId
  → Khi không có HTTP request (Seed / background job): TenantId = Guid.Empty
  → Không tìm thấy Role nào → Exception "Role does not exist"
```

### Giải pháp áp dụng xuyên suốt project

```csharp
// ✅ ĐÚNG — Bypass filter, lọc Tenant thủ công
var role = await context.Roles
    .IgnoreQueryFilters()
    .FirstOrDefaultAsync(r => r.NormalizedName == "ADMIN" && r.TenantId == tenantId);

// Insert thẳng vào join table
context.Set<IdentityUserRole<Guid>>().Add(new IdentityUserRole<Guid>
{
    UserId = userId,
    RoleId = role.Id
});

// ❌ SAI — Bị Global Filter chặn khi không có HTTP context
await userManager.AddToRoleAsync(user, "Admin");
```

### Quy tắc khi làm việc với Role

| Tình huống | Cách làm |
|-----------|---------|
| Trong HTTP request (có JWT) — **tạo** Role | `RoleManager.CreateAsync()` hoạt động bình thường (TenantId gán trực tiếp vào entity) |
| Trong HTTP request (có JWT) — **gán** Role cho User | KHÔNG dùng `AddToRolesAsync`. Dùng `AssignRolesAsync()` (insert thẳng bảng `UserRoles`) |
| Seed / Background job / Hosted Service | Dùng `IgnoreQueryFilters()` + insert/delete thẳng bảng `UserRoles` |
| Cần truy vấn cross-tenant | `context.Roles.IgnoreQueryFilters().Where(r => r.TenantId == targetTenantId)` |

### Lý do `AssignRolesAsync` phải bypass filter ngay cả trong HTTP request

```
userManager.AddToRolesAsync(user, ["Admin"])
  → Nội bộ: RoleManager.FindByNameAsync("ADMIN")
  → Global Filter thêm: AND TenantId == _tenantService.TenantId
  → Thực ra _tenantService.TenantId LÚC NÀY CÓ GIÁ TRỊ (từ JWT)
  → Nhưng vẫn nên bypass để phòng ngừa edge case và nhất quán với pattern
  → Giải pháp chốt: luôn dùng IgnoreQueryFilters() + lọc TenantId thủ công
```

### Debug checklist khi Role không được gán

1. Kiểm tra `dto.Roles` gửi lên — phải là `["Admin"]` (string tên), **không** phải `[null]` hay `[""]`.
2. Kiểm tra Role tồn tại trong DB với đúng `TenantId`.
3. Kiểm tra `AssignRolesAsync` có tìm thấy role bằng `NormalizedName` không (so sánh uppercase).
4. Kiểm tra `user.Id` hợp lệ (≠ Guid.Empty) trước khi gán.

---

## 5. Hệ thống Phân quyền Động (Dynamic Permissions)

### Tổng quan
Hệ thống phân quyền được thiết kế động, dựa trên **Claims** (RoleClaims) thay vì hardcode Role, hỗ trợ kiểm tra chi tiết tới từng hành động (Create, Read, Update, Delete) trên từng resource.

### Các thành phần chính

#### `Authorization/Permissions.cs`
Lớp chứa hằng số định nghĩa tất cả các quyền trong hệ thống. Ngăn chặn lỗi gõ sai (magic strings) và giúp dễ dàng quản lý.
Ví dụ: `Permissions.Users.View`, `Permissions.Roles.Create`.

#### `PermissionPolicyProvider` & `PermissionRequirement`
Dự án sử dụng `IAuthorizationPolicyProvider` (tuỳ chỉnh qua `PermissionPolicyProvider`) để tạo Policy động lúc runtime dựa trên chuỗi permission, thay vì khai báo tĩnh hàng chục policy trong `Program.cs`.
- Tránh việc đăng ký thủ công từng Policy.
- Khi gặp một policy name hợp lệ (thường là một permission string), Provider tự động sinh `AuthorizationPolicy` có chứa `PermissionRequirement`.

#### `HasPermissionAttribute.cs`
Một tùy chỉnh kế thừa từ `AuthorizeAttribute` cho phép sử dụng syntax cực kỳ dọn dẹp và dễ đọc để gán quyền lợi.

#### `PermissionAuthorizationHandler`
Chịu trách nhiệm đánh giá quyền của người dùng tại mỗi request:
- Handler **chỉ** kiểm tra Claims của JWT Context trên **RAM**, không hề call lại qua database (vì quyền đã được load sẵn từ lúc login/token refresh).
- Phân tách ra nhóm quyền đặc cách `Admin`.

#### Memory Cache & Token Generation (`AuthorizationController`)
Để cân bằng giữa "Token Bloat" & "Immediate Revocation", hệ thống sử dụng cache lớp giữa `IMemoryCache`:
1. Khi user login, server dò tìm các `Role` của user.
2. Với mỗi Role, server check Memory Cache (khoá bằng mẫu `$permissions_{TenantId}_{RoleName}`).
3. Nếu Cache hụt (Cache miss), mới truy xuất vào bảng `RoleClaims` dưới DB (truy vấn đã qua tối ưu).
4. Load xong, nhúng toàn bộ Permission là các custom claim vào Jwt Token. OpenIddict sẽ tự động serialize tất cả chúng vào claim `Permission` của response Token.

> **Lưu ý:** `PermissionPolicyProvider` hiện đã hỗ trợ xử lý cả các Policy yêu cầu Feature (prefix `FEATURE:`).

#### Permission Seeder (`DbSeeder.cs`)
- Một tính năng tự động được trang bị khi server `Startup` (HostedService).
- Cơ chế quét (`Reflection`) toàn bộ các hằng số static trong class `Permissions` để tạo danh sách đầy đủ.
- Hiện đã hỗ trợ đầy đủ các module: `Users`, `Roles`, `Tenants`, `Dashboard`, `Products`, `Pricing`.
- Tự động Đồng bộ (Upsert) - Xoá những quyền đã dư thừa/bị lỗi thời và thêm các quyền mới phát sinh vào bảng dữ liệu cho group `Admin`.

### Cấu hình trên API (Controllers)
Sử dụng attribute tuỳ chỉnh `[HasPermission]` đi kèm với hằng số Permission chuẩn (VD: `AdministrationService.Users.View`):

```csharp
[HasPermission(Permissions.Users.View)]
[HttpGet]
public async Task<IActionResult> GetUsers(...)
{
    // Lấy danh sách users
}
```

---

## 6. Lỗi thường gặp & Debug Checklist

### A. OpenIddict trả về `ID2083` — "This server only accepts HTTPS requests"

**Nguyên nhân:** OpenIddict mặc định yêu cầu HTTPS trên `/connect/token`. Khi chạy dev bằng HTTP (`http://localhost:5027`), sẽ bị chặn ngay.

**Giải pháp trong `Program.cs`:**
```csharp
.AddServer(options => {
    options.AcceptAnonymousClients(); // Không bắt buộc client_id
    if (builder.Environment.IsDevelopment())
    {
        options.UseAspNetCore().DisableTransportSecurityRequirement(); // Bỏ yêu cầu HTTPS
    }
})
```

> ⚠️ Chỉ dùng `DisableTransportSecurityRequirement()` trong **Development**. Production phải dùng HTTPS.

---

### B. 403 Forbidden khi gọi API với token hợp lệ

**Checklist debug theo thứ tự:**

1. **Claims trong JWT có Role không?**
   - Role claim phải được gán `SetDestinations(AccessToken)` rõ ràng, nếu không OpenIddict sẽ **xóa claim đó** trước khi phát hành token.
   - Sửa trong `AuthorizationController.cs`:
   ```csharp
   var roleClaim = new Claim(OpenIddictConstants.Claims.Role, roleName);
   roleClaim.SetDestinations(OpenIddictConstants.Destinations.AccessToken);
   identity.AddClaim(roleClaim);
   ```

2. **Handler kiểm tra quyền Admin có đọc đúng claim type không?**
   - OpenIddict dùng claim type `"role"` (lowercase), không phải `ClaimTypes.Role` (full URI).
   - `PermissionAuthorizationHandler` phải kiểm tra cả hai:
   ```csharp
   var isAdmin = context.User.IsInRole("Admin") ||
                 context.User.HasClaim(c => c.Type == "role" && c.Value.Equals("Admin", StringComparison.OrdinalIgnoreCase));
   ```

3. **Middleware TenantId có chạy _trước_ Controller không?**
   - `app.Use(TenantMiddleware)` phải đặt **trước** `app.MapControllers()` trong pipeline.
   - Nếu không, `TenantService.TenantId = Guid.Empty` → Global Query Filter không tìm thấy data.

4. **User có thực sự được gán Role trong DB không?**
   - Kiểm tra bảng `ADMIN_UserRoles` trong database.
   - Nếu DbSeeder đã chạy nhưng user tồn tại trước → logic gán Role trong block `if (adminUser == null)` bị skip.
   - Giải pháp: kiểm tra và gán Role **bên ngoài** block `if (adminUser == null)`.

---

### C. `System.BadImageFormatException: Bad binary signature`

**Nguyên nhân:** File `.cs` được tạo bằng PowerShell `Out-File` mặc định dùng UTF-16 LE, C# compiler không parse được.

**Giải pháp:** Tạo file C# qua công cụ có encoding UTF-8 hoặc `Out-File -Encoding UTF8`.

---

### D. Ambiguous reference `Permissions` (CS0104)

**Nguyên nhân:** Conflict giữa `AdministrationService.Authorization.Permissions` và `OpenIddict.Abstractions.OpenIddictConstants.Permissions` trong cùng file có `using static OpenIddict.Abstractions.OpenIddictConstants`.

```csharp
// ❌ Ambiguous
Permissions.GetAll();
Permissions.Endpoints.Token;

// ✅ Fully-qualified
AdministrationService.Authorization.Permissions.GetAll();
OpenIddictConstants.Permissions.Endpoints.Token;
```

---

### E. `dotnet watch` không áp dụng thay đổi Startup/DI config

Hot reload **không** áp dụng cho `Program.cs` khi thay đổi middleware pipeline hoặc DI registrations.  
→ Phải **Ctrl+C** và khởi động lại `dotnet watch` sau khi thay đổi `Program.cs`.

---

### F. Lỗi `CS9107/CS9113` khi dùng Primary Constructor

**Nguyên nhân:** Khi sử dụng Primary Constructor (C# 12) trong class kế thừa, nếu một tham số vừa được truyền xuống `base()` vừa được truy cập trực tiếp trong code của class con (hoặc dùng để initialize field), compiler sẽ báo lỗi "Parameter is captured into the state of the enclosing type".

**Giải pháp:** Chuyển về sử dụng Constructor truyền thống để tách bạch việc truyền tham số cho lớp cha và việc gán vào private fields của lớp con.

---

### Thứ tự Middleware Pipeline đúng trong `Program.cs`

```
app.UseCors(...)              ← CORS trước nhất (xử lý Preflight OPTIONS)
app.UseAuthentication()       ← Parse JWT Bearer token từ Header
app.UseAuthorization()        ← Kiểm tra Policy / Permission claims
app.Use(TenantMiddleware)     ← Đọc tenant_id từ claim đã parse
app.MapControllers()          ← Route đến Controller endpoint
```

---

## 7. Hệ thống Feature Toggle (Tenant Control)

### 7.1. Khái niệm và Mục đích
Hệ thống Feature Toggle được thiết kế để quản lý việc đóng/mở các module chức năng theo từng **Tenant** (Khách hàng). Điều này cho phép kinh doanh sản phẩm theo nhiều gói dịch vụ khác nhau (Basic, Pro, Enterprise) mà không cần deploy lại code.

| Đặc điểm | Phân quyền (Permission) | Tính năng (Feature) |
|---|---|---|
| **Đối tượng áp dụng** | Người dùng (User) | Khách hàng (Tenant) |
| **Nơi lưu trữ** | Bảng `RoleClaims` | Bảng `TenantFeatures` (Mối quan hệ N-N) |
| **JWT Claim** | `Permission` | `Feature` |
| **Mục đích** | Phân chia công việc nội bộ | Phân chia gói dịch vụ/hợp đồng |

### 7.2. Cấu trúc Feature phân cấp
Features được định nghĩa trong `Authorization/Features.cs` theo cấu trúc cây tương tự Namespace, giúp quản lý linh hoạt từ tổng quát đến chi tiết:
- `Feature.Administration`: Truy cập toàn bộ phân hệ quản trị.
- `Feature.Administration.Users`: Chỉ truy cập module Quản lý người dùng.
- `Feature.MDM.Products`: Truy cập quản lý Sản phẩm.

### 7.3. Cách sử dụng trên API

Sử dụng attribute `[RequiredFeature]` (kế thừa `AuthorizeAttribute`) để bảo vệ các Controller hoặc Action:

```csharp
[ApiController]
[Route("api/[controller]")]
[RequiredFeature(Features.Administration.Users)] // Chỉ Tenant có tính năng này mới gọi được
public class UsersController : ControllerBase { ... }
```

### 7.4. Cơ chế vận hành
1. **Login**: `AuthorizationController` thực hiện truy vấn vào bảng `TenantFeatures` theo `TenantId`, lấy danh sách mã tính năng và nạp vào claim `Feature` của JWT. (Bỏ qua xử lý chuỗi Comma-separated cũ).
2. **Policy Discovery**: Khi gặp `[RequiredFeature("XYZ")]`, `PermissionPolicyProvider` tự động tạo Policy có tên `FEATURE:XYZ`.
3. **Authorization**: `FeatureAuthorizationHandler` kiểm tra:
   - Nếu User là **Admin** hệ thống: Luôn trả về `Succeeded` (Bypass).
   - Nếu Claim `Feature` trong JWT Token chứa giá trị `XYZ`: Trả về `Succeeded`.
   - Trường hợp khác: Trả về `Failed` (403 Forbidden).

### 7.5. Debug Feature
- Kiểm tra token tại [jwt.io](https://jwt.io): Claim `Feature` phải hiển thị chính xác các mã tính năng.
- Phân biệt giữa `401 Unauthorized` (Chưa đăng nhập) và `403 Forbidden` (Tenant chưa mua tính năng này).

---

## 8. Tích hợp Thông báo Thời gian thực (SignalR Service)

### Phân rã kiến trúc (Decoupled WebSocket)
Bắt đầu từ việc tách phần quản lý WebSocket sang một dự án độc lập là `SignalRService`, `AdministrationService` hiện tại **không còn** giữ trách nhiệm duy trì kết nối của các client thông qua SignalR `_hubContext`.

Thay vào đó, khi `AdministrationService` cần phát đi một thông báo đẩy (Push Notification) hoặc báo cáo tiến trình (Job Status), nó tận dụng cơ chế gọi HTTP cục bộ.

### Cách Hangfire và Service tương tác với SignalR
Các tiến trình chạy ngầm qua Hangfire (như `TenantMigrationJob.cs`) hoặc các Service thông thường khi có nhu cầu cập nhật trạng thái sẽ:
1. Giao tiếp thông qua một `ISignalRService` (hoạt động như một HTTP Wrapper).
2. Khi gọi `SendNotificationAsync(...)`, nó sẽ thực thi một HTTP POST request `/api/notifications` nhắm tới `SignalRService` (thường thông qua cổng local `5063` hoặc `7251`).
3. Dữ liệu POST đi kèm Payload chứa thông tin JobId, Status, Message. `SignalRService` sẽ tiếp nhận và chịu trách nhiệm Broadcast (phát thanh) qua WebSocket tới tất cả các Frontend Next.js tương ứng theo `TenantId` hoặc `All`.

Việc tách biệt này giúp hiệu suất của `AdministrationService` khi xử lý các Background Job nặng thông qua Hangfire không bị ảnh hưởng bởi gánh nặng cấp phát/truyền tải tin nhắn của kết nối WebSocket tới hàng vạn client.

---

[Quay lại đầu trang ▲](#administration-service--tài-liệu-kỹ-thuật-chi-tiết)
