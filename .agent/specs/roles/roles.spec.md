# [feature] Quản lý Vai Trò & Phân Quyền Động

> **Notion:** *(chưa có trang riêng — liên kết Users Management)*
> **Stitch Screen ID:** `8c369e37460042e28f699085e8fadcb3` (Desktop Roles & Permissions 2688×2252px)
> **Ngày tạo:** 2026-03-10
> **Cập nhật lần cuối:** 2026-03-25
> **Status:** done
> **Module:** AdministrationService

---

## 📋 Mô tả

Module định nghĩa và quản lý Role (nhóm vai trò như "Kế Toán", "Kho") và các Permission seeded từ code constants. Roles được gán Permission qua JSON Tree UI. JWT Token chứa đủ claims sau login.

## 🎯 Mục tiêu & Actor

- **Actor:** Tenant Admin / System Admin
- **Mục tiêu:** Cho phép tạo/sửa Role tùy chỉnh, gán Permission động, cache invalidation đảm bảo quyền có hiệu lực ngay lần đăng nhập tiếp

## 🖼 UI Design

> Stitch Screen ID: `8c369e37460042e28f699085e8fadcb3` (Desktop 2688×2252px)

### Bố cục tổng thể
- **Sidebar:** Admin Console nav với Roles & Permissions active
- **Main:** H1 "Organization Roles" → 4 Stat Cards (Total Users, Active Roles, Permission Logs, Security Score) → Permission Matrix Table: Hàng = Role Name, Cột = Permission type (Read/Write/Admin/Delete), Ô = checkbox
- **Roles:** SuperAdmin, Manager, Viewer, Auditor

### Danh sách Component
| Component | Mục đích | Server/Client |
|-----------|----------|---------------|
| `RolesPage` | Trang chính danh sách role | Server |
| `RoleFormModal` | Form tạo/sửa role | Client |
| `PermissionTreeSelector` | JSON Tree chọn Permission | Client |

## 🔀 Flow

1. App boot → `PermissionSeeder.SeedAsync()` — quét `Constants string` → Upsert DB Permissions (idempotent)
2. `GET /api/Roles` → danh sách role (filter `IsActive`)
3. Edit Role → `PermissionTreeSelector` render JSON Tree phân cấp → POST/PUT với permission list
4. Save → Redis Cache invalidate → User đăng nhập lại nhận token với claims mới

## 📐 Scope ảnh hưởng

- [x] Model / DB: `ApplicationRole`, `RolePermission`, Permission constants table
- [x] API endpoint: `GET /api/Roles`, `GET /api/Roles/get_role_dropdown`, `POST/PUT/DELETE /api/Roles`
- [x] Permission: Dynamic — seeded từ code, stored in DB
- [x] Frontend: `RolesPage`, `PermissionTreeSelector`
- [ ] Background job: N/A

## ✅ Checklist

### Backend
- [x] Permission Seeder — idempotent, chạy khi boot
- [x] `ApplicationRole` entity + `IsActive` filter
- [x] `RolesController` — CRUD + dropdown endpoint
- [x] Redis cache invalidation khi role thay đổi
- [x] SystemRole protection (read-only, cannot delete)

### Frontend
- [x] `RolesPage` + `RoleFormModal`
- [x] `PermissionTreeSelector` — chọn All Root → check tất cả Sub-Leaves
- [x] Disable Edit/Delete cho SystemRole/Admin

## ⚠️ Rủi ro / Lưu ý

- Không được cho phép xóa/sửa SystemRole — phải protect ở cả Backend và Frontend
- Permission string phải là constant code → không hardcode string tự do
- Xem: [Dynamic Permission SKILL](../../skills/erp-dynamic-permission/SKILL.md)

## 📝 Ghi chú hoàn thành

Stable từ 2026-03-10. Stitch screen đồng bộ Notion ngày 2026-03-25.
