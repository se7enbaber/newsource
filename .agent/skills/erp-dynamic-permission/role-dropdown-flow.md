# Form Dropdown Roles Data Flow

## Khi nào đọc file này
Chỉ đọc khi: Phát triển hoặc sửa đổi form UI trong Frontend có bao gồm input phân quyền (Role, Dropdown Select).

## Tại sao phức tạp
Hiện tượng bug cực kỳ nghiêm trọng liên quan đến TODO list cũ: form submit mảng roles rỗng làm mất toàn bộ quyền của User trên hệ thống Database.

## Phân tích Anti-Pattern
- **Hiện tượng (Sai)**: Gửi payload mảng roles = rỗng `[]` về Server mỗi khi submit Form sửa User do Dropdown không được mapping chuỗi giá trị tương ứng (undefined => fallback array rỗng). Khi API chạy logic update, entity framework sẽ Remove hết toàn bộ relation giữa User và Role.
- **Chuẩn hóa Flow (Đúng)**:
  1. Frontend cần load danh sách cấu trúc User kèm `Roles` đã có.
  2. Bắt buộc map trường dropdown (Select form item) vào mảng các ID dạng chuỗi/int định danh.
  3. Trước thao tác gọi method API để Payload, nên có logic kiểm tra mảng Data Flow Dropdown không bị Null một cách phi lý hoặc validate bằng hook. Thậm chí dùng `useWatch` để quan sát trường form submit.

## Liên quan
- Xem thêm: `mint-erp-dynamic-permission`
