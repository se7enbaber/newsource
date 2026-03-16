---
feature: SignalR Redis Backplane
module: SignalRService
status: stable
updated: 2026-03-14
---

# SignalR Redis Backplane Refinement

## Mô tả
Tinh chỉnh cấu hình SignalR Redis Backplane để đảm bảo tính ổn định và khả năng mở rộng (scaling) của hệ thống thông báo realtime.

## Flow chính
1. `SignalRService` đọc thông tin kết nối Redis từ environment variables (`Redis:Host`, etc.).
2. Khai báo `AddStackExchangeRedis` với `ChannelPrefix` là `SignalR:` để cô lập kênh dữ liệu.
3. Đồng bộ message giữa các instance của `SignalRService` thông qua Redis bus.

## Acceptance Criteria
- [ ] Kết nối Redis Backplane thành công khi khởi động.
- [ ] Message được gửi từ `AdministrationService` (via HTTP API) được broadcast tới tất cả các node thông qua Redis.
- [ ] Tách biệt kênh (ChannelPrefix) với các dịch vụ khác dùng chung Redis.

## Cấu hình (Environment)
- `REDIS_HOST`: redis
- `REDIS_PORT`: 6379
- `REDIS_PASSWORD`: (theo .env)
