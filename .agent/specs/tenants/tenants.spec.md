# [feature] Quản lý Đa Khách Hàng (Tenants)

> **Notion:** https://www.notion.so/Tenants-Management-Spec-32bf1e6a215c81eb9678f495970a1ba3
> **Stitch Screen ID:** `3eafb27ebc9442e7bfe413c8783aa1b1` (Desktop), `d727938df97b4cb7b149e6ff7ffafc8b` (Desktop v2)
> **Ngày tạo:** 2026-03-10
> **Cập nhật lần cuối:** 2026-03-25
> **Status:** done
> **Module:** AdministrationService

---

## 📋 Mô tả

Module quản trị dành cho System/Host Admin điều phối vòng đời của từng Tenant (Client): tạo mới, cấu hình CSDL riêng, soft-delete khi off-board. Mọi request của User trong một Tenant đều mang `TenantId` header ngầm định.

## 🎯 Mục tiêu & Actor

- **Actor:** System Admin (Host)
- **Mục tiêu:** Quản lý toàn bộ vòng đời Tenant — từ đăng ký tới deactivation — kèm cấu hình database isolation

## 🖼 UI Design

> Stitch Screen ID: `3eafb27ebc9442e7bfe413c8783aa1b1` (Desktop 2560×2048px) | `d727938df97b4cb7b149e6ff7ffafc8b` (Desktop v2 2560×2068px) | `e18a4ee00e8d477a821eb7c6504315c5` (Mobile System Health 780×5358px)

### Bố cục tổng thể
- **Sidebar (~220px):** Logo Mint ERP → Nav: Dashboard / Tenants (active) / Roles / Settings → PRO FEATURES + Support + Log Out
- **Main:** H1 "Tenant Organizations" + Filter/Search bar → Card grid 3 cột: mỗi card hiển thị Tên, Ngành, Subdomain, Status badge + action icons (View/Edit/Suspend)

### Danh sách Component
| Component | Mục đích | Server/Client |
|-----------|----------|---------------|
| `TenantsPage` | Trang chính, fetch danh sách tenant | Server |
| `TenantCardGrid` | Grid card hiển thị tenants | Server |
| `TenantFormModal` | Form tạo/sửa tenant + DB config | Client |
| `SystemHealthMobile` | Giám sát service health (mobile) | Client |

## 🔀 Flow

1. `GET /api/tenants?page=&size=` → Render Card Grid
2. Tạo mới: Form nhận `TenantIdentifier`, Tên, DbProvider (Postgres/MSSQL), Connection String → `POST /api/tenants`
3. `ApplicationDbContext` nhận Provider → EF Data Filter / chuyển Context qua Middleware
4. Mọi request sau đều mang `TenantId` header ngầm; Backend `IgnoreQueryFilters` cho Master Admin
5. Xóa: Soft Delete → `DELETE /api/tenants/{id}` → ẩn khỏi list

## 📐 Scope ảnh hưởng

- [x] Model / DB: Entity `Tenant`, EF Core Multi-tenant Filter, `TenantId` trên mọi entity
- [x] API endpoint: GET/POST/DELETE `/api/tenants`
- [x] Permission: `Tenants.View`, `Tenants.Create`, `Tenants.Delete` — chỉ Host Admin
- [x] Frontend: `TenantsPage`, `TenantCardGrid`, `TenantFormModal`
- [x] Background job: `TenantMigrationJob` — chạy migration DB mới khi tạo Tenant

## ✅ Checklist

### Backend
- [x] Entity `Tenant` + EF Multi-tenant Filter
- [x] `TenantsController` với 3 endpoints
- [x] `TenantMigrationJob` (Hangfire) — idempotent, xử lý `42P07` gracefully
- [x] Master Admin bypass `IgnoreQueryFilters`

### Frontend
- [x] `TenantsPage` + `TenantCardGrid`
- [x] `TenantFormModal` với DbProvider selector + Connection string field
- [x] Soft delete với xác nhận

## ⚠️ Rủi ro / Lưu ý

- `TenantMigrationJob` phải idempotent — xem [bug fix](./bug-tenant-migration-notification.spec.md)
- Isolated DB connection string phải validate trước khi save (test connect)
- Liên quan: [Feature Toggles](./tenants-features.spec.md) | [Multitenancy pattern](../../skills/erp-multi-tenant/SKILL.md)

## 📝 Ghi chú hoàn thành

Module đã ổn định. Bug migration `42P07` đã resolve ngày 2026-03-22. UI đã đồng bộ Stitch → Notion ngày 2026-03-25 với 3 screens.
