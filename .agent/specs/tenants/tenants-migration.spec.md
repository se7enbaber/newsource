---
feature: Triển khai CSDL Động
module: AdministrationService
status: stable
updated: 2026-03-22
---

# Quản lý Migrations Tenants

## Mô tả
Tiến trình System Background Tool hỗ trợ Auto Migrate EF DB Context Schema xuống các Tenant Database riêng ngay cả khi Code base update mà không cần Admin can thiệp Deploy manual script.

## Flow chính
Deploy Version mới Backend → Tooling Worker (Hangfire) tạo list Tenant từ CSDL tổng → For Loop từng object `Isolated DB Tenant` có thiết lập Configuration riêng → Trỏ Database Db Connection string qua CSDL đó → Lệnh Execute Background `ApplyMigrationsAsync()` Auto Schema. Ghi Status Completed vào field `LastMigratedAt` vào CSDL Tổng và dùng `ISignalRNotificationService` để gửi thông báo real-time qua WebSocket.

## Acceptance Criteria
- [x] Tự chạy Migrations DB Master vào Startup `ApplyMigrationsAsync()`.
- [x] Chạy Background Job an toàn mà không bị crash HTTP Call API Client.
- [x] Gửi Real-time Alert Notification trên Dashboard Host sau khi Update xong Client CSDL (đã triển khai qua `ISignalRNotificationService`).

## Edge Cases
- Hangfire job activation: tránh enqueue/schedule job bám theo `interface`/`abstract` type trừ khi đã đăng ký DI mapping. Xem: [Hangfire abstract/interface job activation](../administration/bug-hangfire-abstract-job.spec.md).
- **Tính Idempotent (Phục hồi khi bảng đã tồn tại - PostgreSQL 42P07)**: Hệ thống phải đảm bảo tính Idempotent (không bị lỗi khi chạy nhiều lần trên cùng 1 CSDL). 
  - Nếu DB đã có cấu trúc (ví dụ: clone DB chứa sẵn table) nhưng bảng `__EFMigrationsHistory` bị thiếu thông tin dẫn tới lỗi `relation already exists` hoặc `23505`, hệ thống sẽ bắt lỗi (catch exception).
  - Tự động thực hiện SQL Insert thủ công bản ghi `Initial` vào `__EFMigrationsHistory` để đồng bộ trạng thái, tránh crash tiến trình.
  - Sau khi insert, bắt buộc gọi lại `MigrateAsync()` để áp dụng các bản migration tiếp theo (nếu có).
- Fail Db của Tenant Index `1` không được phép Halt tiến trình Update Script DB của Tenant Index `2`. Phục hồi Graceful exception Worker.

## Liên quan
- Khởi chạy WebSocket: [Push SignalR Background Task](../signalr/signalr.spec.md)
