---
name: mint-erp-dynamic-permission
description: Dùng khi cần bảo vệ Controller/Endpoint bằng phân quyền động, tạo permission mới, seed permission vào DB, hoặc debug lỗi 403. KHÔNG dùng cho logic nghiệp vụ không liên quan đến AuthZ.
---

# Dynamic Permission — Phân quyền động

## Cơ chế hoạt động
```text
Request → Bearer JWT → Middleware giải mã JWT
       → [HasPermission("Resource.Action")]
       → Check Redis Cache (Role → Permission list)
       → Nếu cache miss: Query DB → Cache lại
       → Cho phép hoặc trả 403
```

JWT chứa danh sách **Role** của user, không chứa Permission trực tiếp.  
Permission được resolve từ Role → lưu cache Redis khi login thành công.

---

## Convention đặt tên Permission

**Bắt buộc theo format:** `Resource.Action`

| Phần | Quy tắc | Ví dụ |
|------|---------|-------|
| `Resource` | PascalCase, tên nghiệp vụ / module | `User`, `Tenant`, `Invoice`, `AuditLog` |
| `Action` | PascalCase, động từ chuẩn | `View`, `Create`, `Update`, `Delete`, `Export`, `Approve` |

**Danh sách Action chuẩn:**

| Action | Dùng khi |
|--------|----------|
| `View` | GET list hoặc GET by id |
| `Create` | POST tạo mới |
| `Update` | PUT / PATCH chỉnh sửa |
| `Delete` | DELETE (soft delete) |
| `Export` | Xuất file (Excel, PDF…) |
| `Approve` | Duyệt / xác nhận nghiệp vụ |
| `Manage` | Toàn bộ CRUD — dùng hạn chế, chỉ cho Super Admin |

**Ví dụ đúng:**
```
User.View / User.Create / User.Update / User.Delete
Tenant.Manage
Invoice.Export
AuditLog.View
```

**Ví dụ sai:**
```
❌ user_view        // không dùng snake_case
❌ GetUser          // không dùng prefix động từ ở Resource
❌ UserManagement   // không rõ Action
❌ Admin            // quá chung chung
```

---

## Cách dùng `[HasPermission]` trong Controller
```csharp
[ApiController]
[Route("api/users")]
[Authorize]   // ← Bắt buộc ở Controller level
public class UserController(IUserService userService) : ControllerBase
{
    [HttpGet]
    [HasPermission("User.View")]
    public async Task<IActionResult> GetAll() { ... }

    [HttpPost]
    [HasPermission("User.Create")]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto) { ... }

    [HttpPut("{id}")]
    [HasPermission("User.Update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto) { ... }

    [HttpDelete("{id}")]
    [HasPermission("User.Delete")]
    public async Task<IActionResult> Delete(Guid id) { ... }
}
```

> `[HasPermission]` đặt ở **Action level**, không đặt ở Controller level.

---

## Seed Permission mới vào DB

Khi tạo module mới, permission phải được seed để Admin có thể gán cho Role.

**Vị trí:** `PermissionSeeder.cs` (hoặc `DataSeeder.cs`) trong `AdministrationService.Infrastructure`.
```csharp
// Thêm vào danh sách seed — nhóm theo Resource
new Permission { Name = "Invoice.View",   Group = "Invoice", Description = "Xem danh sách hóa đơn" },
new Permission { Name = "Invoice.Create", Group = "Invoice", Description = "Tạo hóa đơn mới" },
new Permission { Name = "Invoice.Update", Group = "Invoice", Description = "Chỉnh sửa hóa đơn" },
new Permission { Name = "Invoice.Delete", Group = "Invoice", Description = "Xóa hóa đơn" },
new Permission { Name = "Invoice.Export", Group = "Invoice", Description = "Xuất file hóa đơn" },
```

> `Group` = tên Resource. Seed phải chạy trước hoặc cùng lúc với migration.

---

## Debug lỗi 403

Kiểm tra theo thứ tự:

**1 — JWT hợp lệ không?**
Decode tại jwt.io → kiểm tra claim `roles` và `exp`.

**2 — Redis cache đúng không?**
Logout → login lại để force re-cache permission list.

**3 — Permission đã seed chưa?**
```sql
SELECT * FROM mt_permissions WHERE name = 'Resource.Action';
```

**4 — Role đã được gán Permission chưa?**
```sql
SELECT * FROM mt_role_permissions rp
JOIN mt_permissions p ON rp.permission_id = p.id
WHERE rp.role_id = '<role_id>';
```

**5 — Tên Permission khớp chính xác không?**
String trong `[HasPermission("...")]` và trong DB phải giống **100%, case-sensitive**.

---

## Sai vs Đúng (Anti-patterns)

| Sai | Đúng |
|-----|------|
| `[Authorize(Roles = "Admin")]` hardcode role | `[HasPermission("Resource.Action")]` |
| `[HasPermission]` đặt ở class level | Đặt trên từng HTTP Action method |
| Permission string tùy tiện mỗi nơi mỗi khác | Tuân theo convention `Resource.Action` |
| Quên seed sau khi tạo controller | Seed cùng lúc với tạo controller |
| Bỏ `[Authorize]` ở Controller | Luôn giữ `[Authorize]` ở Controller + `[HasPermission]` ở Action |

---

## Tham chiếu chéo
- Tạo module mới: `backend-module-checklist` bước 7 phải đi kèm seed permission.
- Kiến trúc layer: `mint-erp-architecture-layer`.
- Multi-tenant scope: `mint-erp-multi-tenant`.