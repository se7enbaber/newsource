---
feature: Cổng giao tiếp API (Gateway)
module: GatewayService
status: stable
updated: 2026-03-10
---

# Gateway Service

## Mô tả
Đóng vai trò là Cổng giao tiếp API (Reverse Proxy) bằng YARP, đứng giữa Frontend và Backend. Phục vụ việc gom chung một endpoint, xử lý CORS tập trung, Health Check và forward SSL LAN.

## Flow chính
Client gọi API → `/api/proxy/[path]` (Next.js config) → Gateway (port 5000/5001) → YARP map/forward route theo `appsettings.json` → Đích đến (AdministrationService hoặc SignalRService).

## Acceptance Criteria
- [ ] Cho phép định tuyến `/api/**` xuống `https://localhost:7027/api/**`
- [ ] Cho phép định tuyến `/connect/**` xuống `https://localhost:7027/connect/**`
- [ ] Cho phép định tuyến `/notificationHub/**` xuống `http://localhost:5200/notificationHub`
- [ ] Tự động xử lý chính sách CORS cho phép NextJS gọi vào
- [ ] Tự động bypass chứng chỉ SSL tự ký khi chạy localhost

## API
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/health` | Chăm sóc sức khoẻ downstreams |
| ANY | `/api/**` | Forward API Rest |
| ANY | `/connect/**` | Forward OpenIddict login |

## Liên quan
- Lỗi kết nối CORS/Preflight
