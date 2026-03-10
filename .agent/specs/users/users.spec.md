---
feature: Quản lý Người Dùng
module: AdministrationService
status: stable
updated: 2026-03-10
---

# Danh mục Người Dùng Vận Hành

## Mô tả
Hiển thị danh sách, phân quyền và điều chỉnh hồ sơ của các nhân viên có mặt trong Tenant bao gồm thông tin truy cập của hệ thống. 

## Flow chính
1. UI Page Grid (Bảng dữ liệu Client) → Call `/api/Users` trả JSON.
2. Thêm mới / Cập nhật:
   - Click nút trên Toolbar (dùng `AppButton`), Popup quản lý (`AppPopup`) gọi Component `UserForm`.
   - Ngăn thay đổi Field Username đối với User đang bật Edit Mode.
   - `SelectedRoles` là array riêng, Frontend bóc string vào Payload gửi REST `/api/Users`.
   - Admin Service tiến hành lookup thông tin, nếu pass, cập nhật info DB → Delete Identity UserRoles trong CSDL ngầm định → IgnoreQueryFilter gán Set List Roles theo payload cấp UI mới.
3. Dữ liệu thay đổi thì bảng Refresh. Mọi dữ kiện DB đều bị soft delete khi gỡ thông tin nhân viên (`IsDeleted`).

## Acceptance Criteria
- [ ] Mở khóa lock Component Popups (nút cancel/escape lock) khi submit. Guard Dialog hiển thị Check Dirty xác nhận Abandon changes.
- [ ] Backend phải tự động chặn duplicate Identity NormalizedUsername với Index kép User/Tenant.
- [ ] Cập nhật password mới của account được chạy flow độc lập (Bypass update empty string pass của UserForm).

## API
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/Users` | PageNumber, PageSize, SearchTerm |
| POST | `/api/Users` | Form Add user kèm Group Role array `string[]` |
| PUT | `/api/Users/{id}` | Update form |
| DELETE | `/api/Users/{id}` | Soft delete thành viên |

## UI Rules & Validation
- Dropdown chọn vai trò `Checkable Tags` không được đẩy dữ liệu null hay array empty trừ khi chủ đích remove sạch các Role của member.
- Table Row có Actions, hover sẽ xổ dropdown hành động.

## Liên quan
- Lỗi TODO Fix User/Role List Null: [Role Bug](../../skills/erp-dynamic-permission/role-dropdown-flow.md)
- Phân luồng Cấu trúc lưới (Table UI Component): [Giao diện Grid](../../skills/erp-frontend-ui/SKILL.md)
