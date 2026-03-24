# [feature] Quản lý Người Dùng

> **Notion:** https://www.notion.so/Users-Management-Spec-32bf1e6a215c8134a15dc0ff71c32173
> **Stitch Screen ID:** `b8cd9c15c2d943c88061b9fcce8f1c27` (Desktop), `32580d61fd304bfab1a93757e58714a1` (Mobile)
> **Ngày tạo:** 2026-03-10
> **Cập nhật lần cuối:** 2026-03-25
> **Status:** done
> **Module:** AdministrationService

---

## 📋 Mô tả

Module quản lý nhân sự cho phép Admin/Tenant Admin xem, thêm, sửa, xóa tài khoản người dùng và phân quyền vai trò trong hệ thống. Áp dụng Soft Delete và đảm bảo tính đơn nhất Username theo Tenant.

## 🎯 Mục tiêu & Actor

- **Actor:** Tenant Admin / System Admin
- **Mục tiêu:** Quản lý toàn bộ vòng đời tài khoản nhân viên trong một Tenant (CRUD + phân quyền Role)

## 🖼 UI Design

> Stitch Screen ID: `b8cd9c15c2d943c88061b9fcce8f1c27` (Desktop 2560×2048px) | `32580d61fd304bfab1a93757e58714a1` (Mobile 780×1998px) | `496f3d21c7ce4be3b48bead21b8d8b94` (Desktop Extended) | `8c369e37460042e28f699085e8fadcb3` (Roles & Permissions) | `e6bc643d35f7453eabf03ee574ccb990` (Mobile v2)

### Bố cục tổng thể
- **Sidebar (~220px):** Logo "Admin Console Enterprise Suite" → Nav dọc với User Management active → PRO FEATURES banner → Avatar cuối
- **Main:** H2 "User Management" + Filter bar (Search + Dropdown Role/Status) + Tab (Overview | Directory | Groups) → Bảng users (Avatar, Name, ID, Email, Role badge, Status chip, Last Login, Actions) → Right panel: Growth Forecast chart + Security Score

### Danh sách Component
| Component | Mục đích | Server/Client |
|-----------|----------|---------------|
| `UsersPage` | Trang chính, fetch danh sách users | Server |
| `UsersTable` | Bảng hiển thị với sort/filter | Server |
| `UserFormModal` | Form thêm/sửa user + chọn role | Client |
| `RolesPermissionsPage` | Ma trận phân quyền Role × Permission | Server |

## 🔀 Flow

1. UI Page Grid → `GET /api/Users?page=&size=&search=`
2. Thêm mới: Click Toolbar → `AppPopup` mở `UserForm` → `POST /api/Users` (với `selectedRoles: string[]`)
3. Cập nhật: Edit mode → ngăn thay đổi Username → `PUT /api/Users/{id}` → Delete Identity UserRoles → Set roles mới
4. Xóa: Soft delete (`IsDeleted = true`) → `DELETE /api/Users/{id}`
5. Dữ liệu thay đổi → Table tự refresh

## 📐 Scope ảnh hưởng

- [x] Model / DB: Entity `ApplicationUser`, `UserRole` — Soft Delete, Index kép (Username + TenantId)
- [x] API endpoint: GET/POST/PUT/DELETE `/api/Users`
- [x] Permission: `Users.View`, `Users.Create`, `Users.Edit`, `Users.Delete`
- [x] Frontend: `UsersPage`, `UsersTable`, `UserFormModal`
- [ ] Background job / SignalR: N/A

## ✅ Checklist

### Backend
- [x] Entity `ApplicationUser` với Soft Delete (`IsDeleted`)
- [x] Index kép `(NormalizedUserName, TenantId)` chống duplicate
- [x] `UsersController` với 4 endpoints
- [x] Logic tách flow đổi password riêng (bypass empty string)

### Frontend
- [x] `UsersPage` + `UsersTable` (AppButton, AppPopup)
- [x] `UserForm` với `Checkable Tags` chọn Role
- [x] Guard Dialog xác nhận Abandon changes khi dirty
- [x] Dropdown Role không push null / empty array

## ⚠️ Rủi ro / Lưu ý

- `SelectedRoles` là array riêng — Frontend phải bóc string trước khi gửi REST
- Không được thay đổi Username khi Edit Mode đang bật
- Fix liên quan: [Role Bug](../../skills/erp-dynamic-permission/role-dropdown-flow.md)

## 📝 Ghi chú hoàn thành

Module đã hoàn thành và ổn định (status: stable). Thiết kế UI đã được đồng bộ lên Notion ngày 2026-03-25 với 5 Stitch screens (Desktop + Mobile + Roles & Permissions).
