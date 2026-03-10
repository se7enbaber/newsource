---
feature: Triển khai CSDL Động
module: AdministrationService
status: stable
updated: 2026-03-10
---

# Quản lý Migrations Tenants

## Mô tả
Tiến trình System Background Tool hỗ trợ Auto Migrate EF DB Context Schema xuống các Tenant Database riêng ngay cả khi Code base update mà không cần Admin can thiệp Deploy manual script.

## Flow chính
Deploy Version mới Backend → Tooling Worker (Hangfire) tạo list Tenant từ CSDL tổng → For Loop từng object `Isolated DB Tenant` có thiết lập Configuration riêng → Trỏ Database Db Connection string qua CSDL đó → Lệnh Execute Background `ApplyMigrationsAsync()` Auto Schema. Ghi Status Completed vào field `LastMigratedAt` vào CSDL Tổng và dùng REST Call SignalR Update Web UI WebSocket Panel.

## Acceptance Criteria
- [ ] Tự chạy Migrations DB Master vào Startup `IsDevelopment()`.
- [ ] Chạy Background Job an toàn mà không bị crash HTTP Call API Client.
- [ ] Gửi Real-time Alert Notification trên Dashboard Host sau khi Update xong Client CSDL.

## Edge Cases
- Fail Db của Tenant Index `1` không được phép Halt tiến trình Update Script DB của Tenant Index `2`. Phục hồi Graceful exception Worker.

## Liên quan
- Khởi chạy WebSocket: [Push SignalR Background Task](../signalr/signalr.spec.md)
