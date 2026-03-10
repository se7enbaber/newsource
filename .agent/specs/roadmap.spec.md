---
feature: Lộ trình phát triển
module: Toàn hệ thống
status: planned
updated: 2026-03-10
---

# Lộ trình các tính năng chờ phát triển (Roadmap)

## Mô tả
Tập hợp danh mục hạng mục kỹ thuật Planned chưa được xây dựng cho hệ thống.

## Giai đoạn 2: Tính năng nghiệp vụ Mở Rộng
- [ ] **Audit Log UI**: Lịch sử thao tác nhật ký Data. Cần Grid Data Source fetch table, hỗ trợ List Action/Diff logs Cũ Mới cho Admin check (DB Backend đã auto catch Log lưu trong EF).
- [ ] **Email & Alert Notification Service**: Component System Send SMTP thông báo quên mật khẩu hoặc Create account welcome. Dùng cơ chế Message Hangfire Job enqueue gửi ngầm, support Template Render UI.
- [ ] **Data File Storage Service**: Quản lý API Avatar và Tài liệu Document. Dữ liệu tập trung vào MinIO Storage theo Folder định tuyến Tenant Bucket, bypass File Storage Server API (Port 8080).

## Giai đoạn 3: Scale Hệ thống
- [ ] **API Protection/Rate Limiting**: Giảm thiểu Tấn Cống/Spam Request tới các Port Login bằng thư viện RateLimiter Core 7+ Map trực tiếp lên YARP Reverse Gateway Proxy level IP/TenantId. 
- [ ] **Observability/Distributed Tracing**: Gắn bộ thư viện Component OpenTelemetry + Jaeger Visualization vào toàn bộ các Trace Request/Service để vẽ Waterfall request từ Next.js tới Backend SQL Database Query.
- [ ] **CI/CD Build Action**: Automate Scripts Action trên Gitea/Github chạy Docker Compose Images.
