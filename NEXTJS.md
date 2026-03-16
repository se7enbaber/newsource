# NEXTJS.md - Frontend Development Rules

> [!IMPORTANT]
> Quy tắc này áp dụng cho toàn bộ quá trình phát triển Frontend trong thư mục `my-nextjs`.

## 1. Phân tích yêu cầu (Analysis Rule)
- Trước khi bắt đầu bất kỳ task nào (tính năng mới, thay đổi logic, hoặc sửa lỗi), bạn **BẮT BUỘC** phải chạy skill `erp-analyst`.
- **Quy trình**:
    1. Tóm tắt yêu cầu (Goal, Actor, Flow, Scope).
    2. Hỏi lại các điểm chưa rõ.
    3. Đề xuất phương án và trade-offs.
    4. Cập nhật/Tạo mới file spec trong `.agent/specs/`.
- **🔴 HARD-GATE**: Tuyệt đối không viết bất kỳ dòng code nào cho đến khi người dùng phê duyệt phương án (Confirm).

## 2. Quy trình Superpowers
- Tuân thủ nghiêm ngặt 8 bước trong `.agent/ANTIGRAVITY_INSTRUCTIONS.md`.
- **TDD (Test-Driven Development)**: Luôn tạo failing test (Playwright hoặc Unit test) trước khi viết code thực tế.
- **Verification**: Luôn chạy test và verify thủ công trước khi báo hoàn thành.

## 3. Quy tắc UI/UX
- **Component**: Luôn sử dụng các component dùng chung từ `app/components/common` (ví dụ: `AppGrid`, `AppButton`, `AppLayout`) thay vì import trực tiếp từ thư viện Ant Design.
- **Design**: Tuân thủ phong cách thiết kế hiện đại, premium, sử dụng các micro-animations và hiệu ứng mượt mà.
- **i18n**: Luôn sử dụng `useTranslation` để đa ngôn ngữ hóa các text hiển thị.
- **Permissions**: Kiểm tra quyền truy cập thông qua `usePermission()` trước khi hiển thị component hoặc cho phép hành động.

## 4. Cấu trúc và Naming
- Tuân thủ cấu trúc App Router của Next.js.
- Các component chỉ dùng cho một trang cụ thể phải đặt ở thư mục `_components` của trang đó.
- Naming file và component theo phong cách PascalCase hoặc kebab-case tùy theo quy chuẩn của dự án.
