---
feature: Cấu hình giới hạn Rate Limit
module: GatewayService
status: stable
updated: 2026-03-10
---

# Rate Limiting & Proxy IP Forwarding

## Mô tả
Tính năng chặn Brute-force & DDOS tự động bằng `AspNetCore.RateLimiting` của .NET 8, đứng tại YARP Gateway. Hỗ trợ cấu hình nóng qua giao diện "System Config" của Tenant Admin, áp dụng tham số real-time mà không cần khởi động lại dịch vụ.

## Flow chính
1. Trình duyệt gửi API Login/Call Data tới Next.js Proxy.
2. Next.js App Router Proxy (`api/proxy/[...path]/route.ts`) bóc tách IP Client chính xác và gửi theo Header `X-Forwarded-For`.
3. Gateway Service nhận request, gọi Middleware `UseRateLimiter()`.
4. Extention `AddDynamicRateLimiter()` sẽ đọc Redis Cache (key `RateLimit:Global:PermitLimit` hoặc `Auth:PermitLimit`) qua `IDistributedCache`.
5. Nếu vượt mức → Trả `429 Too Many Requests` (Header: `Retry-After`).
6. Nếu pass → YARP map route xuống Backend `AdministrationService`.
7. Tại Next.js UI (`/administration/system-config`), Host Admin chỉnh sửa số lượng Rate. Gửi Request POST `SystemConfigController.cs` → Ghi đè vào Redis → Áp dụng tự động.

## Acceptance Criteria
- [ ] Bóc đúng `X-Forwarded-For` từ Proxy, không dính IP máy trạm nội bộ của Docker.
- [ ] Báo lỗi 429 nếu IP gửi liên tiếp > N limit / 10s (Global) hoặc / 30s (Auth).
- [ ] Cấu hình từ UI "Cấu hình cổng Gateway" cập nhật thẳng sang Redis.
- [ ] Gateway đọc Redis real-time không gây đứng (đọc Cache string) hoặc fallback MemoryCache nếu Redis lỗi.
- [ ] Chỉ Host Tenant `Admin` mới thấy Menu và quyền thao tác.

## API
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/SystemConfig/rate-limit` | Tải dữ liệu Rate Limit từ Redis |
| POST | `/api/SystemConfig/rate-limit` | Lưu đè cấu hình giới hạn | 

## UI Rules & Validation
- Block hiển thị màn hình nằm trong Layout riêng, sử dụng Role bảo vệ `[Authorize]` và `hostOnly: true`.

## Liên quan
- Gateway Route Map: [Gateway spec](./gateway.spec.md)
- Redis Cache: Kiến trúc Infrastructure Base của ShareService.
