---
feature: Tổ chức & Khách hàng
module: AdministrationService
status: stable
updated: 2026-03-10
---

# Quản lý Đa Khách Hàng (Tenants)

## Mô tả
Module quản trị dành riêng cho System/Host Admin điều khiển vòng đời hoạt động của từng Client (Tenant), các config CSDL.

## Flow chính
Truy xuất Màn Hình Grid Tenant `/api/tenants` → Danh sách Tenant list.
Form chỉnh sửa Add/Edit của Frontends nhận Cấu hình `TenantIdentifier`, Tên Hiển Thị, DbProvider (Postgres/Mssql) và chuỗi Isolated Connection string Database. Sau đó Save record cập nhật. Request User sau cùng của Tenant gọi qua Endpoint nào cũng mang TenantId Header ngầm định. Code Backend `ApplicationDbContext` nhận Provider phân mảnh Filter EF Data hoặc đổi sang Context IP Server khác cấp Middleware.

## Acceptance Criteria
- [ ] Cho phép khai báo Database riêng kết nối (nếu dùng Isolated Schema).
- [ ] Ngầm auto bypass Record của User "Master Admin".
- [ ] Tự auto đính kèm `TenantId` qua EF Core Overriding.
- [ ] Xoá Tenant phải thông qua Soft Delete, che mờ list của user UI. 

## API
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/tenants` | Paged Tenants Array Data |
| POST | `/api/tenants` | Upload Object Tạo DB Tenant Identifier |
| DELETE | `/api/tenants/{id}`| Remove Client khỏi danh mục Active |

## Liên quan
- Đọc tiếp luồng Gói Dịch vụ Tenant: [Feature Toggles](./tenants-features.spec.md)
- Filter Data ngầm và Bypass Lệnh Ngầm: [Multitenancy pattern/Skill](../../skills/erp-multi-tenant/SKILL.md)
