# Spec: Sửa lỗi Deprecation Ant Design Timeline

## 1. Vấn đề (Problem)
- **Mô tả**: Khi chạy ứng dụng, console hiển thị cảnh báo: `Warning: [antd: Timeline] items.children is deprecated. Please use items.content instead.`
- **Nguyên nhân**: Thư viện `antd` (phiên bản `^6.3.0` theo `package.json`) đã thay đổi tên thuộc tính trong mảng `items` của component `Timeline` từ `children` sang `content`.
- **Vị trí lỗi**: `d:\App\Project\my-nextjs\app\page.tsx:282`
- **Ngày phát hiện**: 2026-03-15
- **Ngày xử lý**: 2026-03-15

## 2. Phân tích (Analysis)
- Component `Timeline` đang nhận prop `items` là một mảng các object.
- Mỗi object hiện tại có cấu trúc: `{ dot, children }`.
- Ant Design yêu cầu đổi thành: `{ dot, content }`.

## 3. Giải pháp (Solution)
- Đổi tên thuộc tính `children` thành `content` trong tất cả các item của mảng `items` truyền vào `Timeline`.

## 4. Checklist thực hiện
- [ ] Đọc file `app/page.tsx`.
- [ ] Thay thế `children:` bằng `content:` trong khối code của `Timeline`.
- [ ] Kiểm tra lại giao diện dashboard monitoring để đảm bảo Timeline vẫn hiển thị đúng.

## 5. Metadata
- **Status**: pending
- **Priority**: low (UI warning)
- **Department**: Frontend
