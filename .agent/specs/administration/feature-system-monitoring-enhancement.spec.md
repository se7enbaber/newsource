# [enhance] Nâng cấp Dashboard Giám sát Hệ thống

> **Notion:** *(chưa tạo — enhancement nhanh, resolve nội bộ)*
> **Ngày tạo:** 2026-03-15
> **Cập nhật lần cuối:** 2026-03-25
> **Status:** done
> **Module:** Frontend (my-nextjs)

---

## 📋 Mô tả

Nâng cấp toàn diện Dashboard giám sát hệ thống: fix Ant Design deprecation `Timeline.children`, thêm biểu đồ Area Chart CPU/RAM realtime cho từng Microservice, và Redis Explorer Modal hiển thị Keyspace + Memory breakdown.

## 🎯 Mục tiêu & Actor

- **Actor:** System Admin / Host Admin
- **Mục tiêu:** Cung cấp công cụ giám sát trực quan, real-time cho toàn bộ microservices stack và Redis

## 🖼 UI Design

> Stitch Screen ID: `e18a4ee00e8d477a821eb7c6504315c5` (Mobile System Health 780×5358px — xem Tenants Notion page)

### Bố cục tổng thể
- **Main Dashboard:** Service cards (Administration, Gateway, SignalR, Identity) với Lume Dot status → Click → Mở Modal biểu đồ Area Chart CPU+RAM (lịch sử 6 snapshots, 10s/poll)
- **Redis Card:** Memory Used / Peak + Click → Mở Redis Explorer Modal (Keyspace DB0–DBn, Memory pie chart)

### Danh sách Component
| Component | Mục đích | Server/Client |
|-----------|----------|---------------|
| `SystemDashboardPage` | Trang giám sát chính | Server |
| `ServiceMetricsModal` | Area chart CPU+RAM per service | Client |
| `RedisExplorerModal` | Keyspace + memory breakdown | Client |

## 🔀 Flow

1. Page load → `GET /api/Monitoring/services-health` → render service cards
2. `setInterval(10s)` → poll metrics → accumulate 6 snapshots per service
3. User click service card → Modal mở với Area Chart (CPU %, RAM MB) từ snapshot history
4. User click Redis card → `GET /api/Monitoring/redis-info` → Modal Redis Explorer

## 📐 Scope ảnh hưởng

- [x] Model / DB: N/A
- [x] API endpoint: `GET /api/Monitoring/services-health`, `GET /api/Monitoring/redis-info` (đã có)
- [x] Permission: `Monitoring.View`
- [x] Frontend: `my-nextjs/app/page.tsx` — refactor component + `recharts` integration

## ✅ Checklist

### Frontend
- [x] Fix Ant Design: `Timeline.children` → `Timeline.content`
- [x] Setup polling logic (10s interval, store max 6 snapshots)
- [x] `ServiceMetricsModal` — Area Chart CPU & RAM với `recharts`
- [x] `RedisExplorerModal` — Keyspace list + Memory pie chart
- [x] Dark-theme modals + hover effects

## ⚠️ Rủi ro / Lưu ý

- Polling 10s/lần tạo continuous requests — cần cleanup `clearInterval` khi unmount
- `recharts` thêm ~50KB bundle size

## 📝 Ghi chú hoàn thành

Hoàn thành 2026-03-15. File sửa: `my-nextjs/app/page.tsx`.
