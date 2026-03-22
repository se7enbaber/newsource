---
description: PM Assistant - Quy trình tiếp nhận và quản lý yêu cầu
---
# PM Assistant Workflow

Bất cứ khi nào người dùng mô tả một yêu cầu mới (bug, tính năng, hoặc cải tiến), hãy tuân thủ quy trình sau:

## 1. Phân loại yêu cầu
Xác định loại yêu cầu:
- `[fix_bug]`: Lỗi hệ thống, hành vi không mong muốn.
- `[enhance]`: Cải tiến tính năng hiện có, tối ưu hóa.
- `[feature]`: Tính năng mới hoàn toàn.

## 2. Tạo Issue trên Notion
Tạo một page mới trong database **"Issues Tracker"**.

### Cấu trúc Notion Database
- **Title**: `[loại_yêu_cầu] {Tiêu đề ngắn gọn}`
- **Type**: `fix_bug` | `enhance` | `feature` (Select)
- **Module**: `{Tên module/chức năng}` (Text, ví dụ: `Administration > Users`)
- **Status**: `Todo` (Default)
- **Priority**: `Low` | `Medium` | `High` | `Critical` (Select)
- **Date**: Ngày hôm nay
- **Reporter**: Người báo (mặc định lấy tên người dùng hoặc "User")
- **Assignee**: Người xử lý (mặc định là "Antigravity")

### Cấu trúc Nội dung Page (Body)
```markdown
## 📋 Mô tả
[Mô tả rõ vấn đề / yêu cầu là gì]

## 🖼 Hình chụp / Video
[Đính kèm ảnh chụp màn hình nếu có — paste URL hoặc upload]

## 🔍 Phân tích nguyên nhân
[Phân tích tại sao xảy ra / tại sao cần làm]
- File liên quan: ...
- Component: ...
- API/Service: ...

## ✅ Danh sách Tasks
- [ ] Task 1: ...
- [ ] Task 2: ...
- [ ] Task 3: ...
(Ước tính: X giờ)

## 📝 Ghi chú sau khi hoàn thành
[Điền sau khi done: đã làm gì, commit nào, có side effect không]
```

## 3. Cập nhật Issue sau khi hoàn thành
Sau khi thực hiện xong công việc:
- Chuyển **Status** sang `Done`.
- Cập nhật mục **"Ghi chú sau khi hoàn thành"** trong nội dung page.
- Đính kèm link commit hoặc PR nếu có.

## Quy tắc bổ sung
- **Title Format**: Luôn bắt đầu bằng `[loại_yêu_cầu]`.
- **Tasks**: Chia nhỏ thành các task nhỏ hơn hoặc bằng 2 giờ.
- **Module**: Phân tích từ mô tả để xác định đúng chức năng.
- **Sync Local Doc**: Nếu yêu cầu thay đổi logic/tính năng đã có spec, BẮT BUỘC cập nhật file `.md` tại `.agent/specs/` trước khi dán nội dung/link vào Notion.
