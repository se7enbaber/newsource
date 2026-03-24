# [feature] Gateway Service (YARP Reverse Proxy)

> **Notion:** *(chưa có trang riêng — xem System Architecture)*
> **Ngày tạo:** 2026-03-10
> **Cập nhật lần cuối:** 2026-03-25
> **Status:** done
> **Module:** GatewayService (YARP)

---

## 📋 Mô tả

Cổng API trung gian dùng YARP (Yet Another Reverse Proxy), đứng giữa Next.js Frontend và các Backend services. Gom một endpoint duy nhất, xử lý CORS tập trung, Health Check và bypass SSL self-signed cho môi trường dev.

## 🎯 Mục tiêu & Actor

- **Actor:** Next.js Frontend (client), tất cả Backend services (upstream)
- **Mục tiêu:** Định tuyến thông minh, bảo mật CORS, ẩn địa chỉ Backend khỏi Client

## 🔀 Flow

```
Next.js → /api/proxy/[path]
    ↓
Gateway (port 5002 HTTP / 5001 HTTPS)
    ↓
YARP map theo appsettings.json:
  /api/**          → https://admin-service:8080/api/**
  /connect/**      → https://admin-service:8080/connect/**
  /notificationHub → http://signalr:10000/notificationHub
```

## 📐 Scope ảnh hưởng

- [x] API endpoint: `/health`, `/api/**`, `/connect/**`, `/notificationHub/**`
- [x] Permission: CORS policy — whitelist Next.js origin
- [ ] Model / DB: N/A
- [ ] Frontend: N/A
- [ ] Background job: N/A

## ✅ Checklist

### GatewayService
- [x] YARP route config trong `appsettings.json`
- [x] CORS policy cho Next.js origin (port 3000 + 3001)
- [x] SSL bypass handler cho self-signed cert (dev)
- [x] Health Check endpoint `/health`

## ⚠️ Rủi ro / Lưu ý

- Port phải nhất quán: Gateway `5002` (HTTP trong docker-compose), Next.js `NEXT_PUBLIC_API_URL=http://localhost:5002`
- `/notificationHub` route → SignalR port `10000` (không phải `8080`)

## 📝 Ghi chú hoàn thành

Stable từ 2026-03-10. Xem thêm: [rate-limiting.spec.md](./rate-limiting.spec.md) cho Rate Limiting config.
