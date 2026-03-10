---
feature: Quản lý Vai Trò Quyền Hạn
module: AdministrationService
status: stable
updated: 2026-03-10
---

# Cấu hình Nhóm Vai Trò 

## Mô tả
Module định nghĩa các Group Group vai trò (VD: Kế Toán, Kho) và thực thi cấp quyền cho những tính năng nhỏ bên trong đó. 

## Flow chính
1. Khởi tạo Seeder Tool: Start App DB quét static property (Constants string) lấy chuỗi dạng `AdministrationService.Modules.View`, Merge DB Roles list mặc định theo system (Ví dụ admin).
2. Khi User xem Role trên Frontends: Dropdown chỉ đổ những Object Role đang có giá trị active (`IsActive`). 
3. Edit Màn Hình: Cấu trúc JSON Tree phân list quyền theo hệ thống cấp bậc, chọn tick check.
4. Lệnh POST Cập nhật được ghi trên Database. Redis MemoryCache Invalidate. Nhận token session User đợt sau.

## Acceptance Criteria
- [ ] Cho phép định nghĩa nhóm vai trò với Môi trường Tên/Mô tả theo Client Ngữ liệu.
- [ ] Seeder Tool phải cập nhật string DB Policy không fail khi boot.
- [ ] Phân biệt được Loại Status SystemRole (ẩn xoá, read only quyền hạn). 

## API
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/Roles` | Lấy danh sách Vai trò (Paged dữ liệu) |
| GET | `/api/Roles/get_role_dropdown`| Lấy array tên active drop popup `name` mapping |
| POST/PUT/DELETE | `/api/Roles` | Update `ApplicationRole` table |

## UI Rules & Validation
- Chọn All Tree Root sẽ phủ Check tất cả Sub-Leaves bên trong mảng Group Array chức năng.
- Chặn disable Nút trạng thái Toggle/Name input trong component Edit với System/Admin.

## Liên quan
- Xem Skill: [Khởi tạo Controller mới có Authorize Parameter](../../skills/erp-dynamic-permission/SKILL.md)
