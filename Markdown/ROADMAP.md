# 🗺 Lộ trình Phát triển Hệ thống (Development Roadmap)

> Dựa trên kiến trúc hiện tại: **AdministrationService** · **GatewayService (YARP)** · **SignalRService** · **my-nextjs**  
> Cập nhật: 03/2026

---

## 📊 Đánh giá Hiện trạng

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Kiến trúc Microservice | ✅ Hoàn thiện | Gateway, Admin, SignalR tách biệt rõ ràng |
| Multi-tenant | ✅ Hoàn thiện | Dynamic Connection String, Global Query Filter |
| Phân quyền động | ✅ Hoàn thiện | JWT RoleClaims, `[HasPermission]`, IMemoryCache |
| Real-time Notification | ✅ Hoàn thiện | SignalR WebSocket tách service riêng |
| Background Jobs | ✅ Hoàn thiện | Hangfire (DB Migration tracking) |
| Frontend Permission UI | ✅ Hoàn thiện | Sidebar, PermissionProvider, Checkbox/List |
| Containerization | ✅ Hoàn thiện | Đã có Dockerfile và docker-compose.yml |
| Centralized Logging | ✅ Hoàn thiện | Tích hợp Serilog + Seq tập trung |
| Health Checks | ✅ Hoàn thiện | Đã expose `/health` endpoint cho tất cả service |
| Hướng dẫn (Feature Tour) | ✅ Hoàn thiện | AppTour đa ngôn ngữ trên các trang nghiệp vụ chính |
| Xuất Excel (Export) | ✅ Hoàn thiện | Hỗ trợ xuất Excel trên Tenants, Users, Roles, Products |
| Audit Log UI | ⚠️ Một phần | Có Auto Audit ở DB, chưa có giao diện xem |
| Email / Notification | ❌ Chưa có | Chưa có kênh gửi email |
| File Storage | ❌ Chưa có | Chưa xử lý upload file/ảnh |
| Rate Limiting | ❌ Chưa có | Gateway chưa có throttling theo Tenant/IP |
| Distributed Tracing | ❌ Chưa có | Chưa trace request xuyên service |
| CI/CD Pipeline | ❌ Chưa có | Build/deploy còn thủ công |

---

## 🚀 Giai đoạn 1 — Production Readiness (Ngắn hạn)

> **Mục tiêu:** Hệ thống đủ ổn định, dễ deploy và dễ debug trên môi trường thực tế.

### 1.1 Containerization (Docker + Docker Compose)

**Vấn đề hiện tại:** Hệ thống khởi chạy thủ công qua `start-terminals.cmd` — fragile, khó deploy lên server.

**Giải pháp:**
- Tạo `Dockerfile` cho từng service: `AdministrationService`, `GatewayService`, `SignalRService`, `my-nextjs`
- Tạo `docker-compose.yml` ở thư mục gốc để orchestrate toàn bộ stack
- Bao gồm PostgreSQL/SQLServer container trong compose
- Thay thế hoàn toàn `start-terminals.cmd` bằng `docker compose up`

**Công nghệ:** Docker, Docker Compose  
**Độ phức tạp:** ⭐⭐☆☆☆  
**Ưu tiên:** 🔴 Cao

---

### 1.2 Centralized Logging (Structured Logging)

**Vấn đề hiện tại:** Khi lỗi xảy ra ở môi trường multi-tenant đa service, rất khó trace nguyên nhân.

**Giải pháp:**
- Tích hợp **Serilog** vào tất cả service .NET
- Sink log ra file (rotating daily) và tùy chọn **Seq** (self-hosted log UI)
- Chuẩn hóa log format: luôn kèm `TenantId`, `UserId`, `TraceId`
- Frontend: tích hợp error boundary và gửi lỗi client-side về endpoint log

**Công nghệ:** Serilog, Seq (tùy chọn)  
**Độ phức tạp:** ⭐⭐☆☆☆  
**Ưu tiên:** 🔴 Cao

---

### 1.3 Health Check Endpoints

**Vấn đề hiện tại:** Không có cách nào tự động biết service nào đang chết.

**Giải pháp:**
- Mỗi service .NET expose endpoint `/health` dùng `AspNetCore.HealthChecks.*`
- Kiểm tra: kết nối DB, kết nối service phụ thuộc
- Gateway tích hợp health check downstream (AdminService, SignalRService)
- Tùy chọn: tích hợp dashboard **Healthchecks UI**

**Công nghệ:** `AspNetCore.HealthChecks.UI`, `AspNetCore.HealthChecks.NpgSql`  
**Độ phức tạp:** ⭐☆☆☆☆  
**Ưu tiên:** 🟠 Trung bình - Cao

---

## 🔧 Giai đoạn 2 — Tính năng Nghiệp vụ Mở rộng (Trung hạn)

> **Mục tiêu:** Bổ sung các tính năng quan trọng mà khách hàng doanh nghiệp thường yêu cầu.

### 2.1 Audit Log UI (Nhật ký Thao tác)

**Vấn đề hiện tại:** Đã có Auto Audit ghi vào DB qua `SaveChangesAsync` override, nhưng chưa có giao diện xem.

**Giải pháp:**
- Thiết kế bảng `AuditLogs` chuẩn: `EntityName`, `Action`, `OldValues`, `NewValues`, `UserId`, `TenantId`, `Timestamp`
- API endpoint lọc log theo: Tenant, User, Entity, Action, khoảng thời gian
- Giao diện Frontend: bảng lịch sử có filter, sort, phân trang
- Phân quyền: chỉ Host Admin hoặc Tenant Admin mới xem được

**Công nghệ:** EF Core (đã có), Next.js Table Component  
**Độ phức tạp:** ⭐⭐⭐☆☆  
**Ưu tiên:** 🟠 Trung bình - Cao

---

### 2.2 Email / Notification Service

**Vấn đề hiện tại:** Chỉ có real-time push qua SignalR, không có kênh thông báo bền vững (quên mật khẩu, xác thực email, cảnh báo hệ thống).

**Giải pháp:**
- Tích hợp SMTP hoặc provider (SendGrid, Mailgun) vào AdministrationService
- Dùng **Hangfire** (đã có) để queue email gửi nền, tránh blocking request
- Template email động theo Tenant (logo, màu sắc, tên tổ chức)
- Các loại email cần thiết ngay: Reset Password, Welcome User, Tenant Migration Done

**Công nghệ:** MailKit/SMTP, Hangfire (đã có), Razor Email Templates  
**Độ phức tạp:** ⭐⭐⭐☆☆  
**Ưu tiên:** 🟠 Trung bình

---

### 2.3 File Storage Service

**Vấn đề hiện tại:** Chưa có cơ chế upload/quản lý file (avatar user, tài liệu đính kèm).

**Giải pháp:**
- Thiết kế endpoint upload tập trung trong AdministrationService
- Lưu trữ: local disk (dev) hoặc **MinIO** (self-hosted S3-compatible, production)
- Cô lập file theo Tenant (mỗi tenant có bucket/folder riêng)
- Tích hợp upload avatar vào màn hình Profile người dùng (đã có Avatar Popup)

**Công nghệ:** MinIO, AWSSDK.S3 (tương thích MinIO)  
**Độ phức tạp:** ⭐⭐⭐☆☆  
**Ưu tiên:** 🟡 Trung bình

---

## 📈 Giai đoạn 3 — Quan sát & Mở rộng Hệ thống (Dài hạn)

> **Mục tiêu:** Hệ thống sẵn sàng scale, dễ quan sát, tự động hóa deployment.

### 3.1 Rate Limiting & Throttling tại Gateway

**Vấn đề hiện tại:** Gateway là điểm vào duy nhất nhưng chưa có bảo vệ chống lạm dụng API.

**Giải pháp:**
- Áp dụng `RateLimiter` middleware (.NET 7+ built-in) tại GatewayService
- Chiến lược giới hạn theo: IP, TenantId, UserId
- Endpoint nhạy cảm (Login, Register) giới hạn nghiêm ngặt hơn
- Trả về HTTP 429 với header `Retry-After` chuẩn

**Công nghệ:** `System.Threading.RateLimiting` (.NET built-in)  
**Độ phức tạp:** ⭐⭐☆☆☆  
**Ưu tiên:** 🟡 Trung bình

---

### 3.2 Distributed Tracing (OpenTelemetry)

**Vấn đề hiện tại:** Không thể trace một request xuyên suốt từ Next.js → Gateway → AdminService → SignalR.

**Giải pháp:**
- Tích hợp **OpenTelemetry** SDK vào tất cả service .NET
- Export trace sang **Jaeger** hoặc **Zipkin** (self-hosted)
- Gắn `TraceId` vào tất cả log Serilog (liên kết với Giai đoạn 1.2)
- Visualize waterfall diagram để tối ưu hiệu năng

**Công nghệ:** OpenTelemetry .NET SDK, Jaeger  
**Độ phức tạp:** ⭐⭐⭐⭐☆  
**Ưu tiên:** 🟢 Thấp - Trung bình

---

### 3.3 CI/CD Pipeline

**Vấn đề hiện tại:** Build và deploy còn thủ công qua `AppPublish.bat`.

**Giải pháp:**
- Thiết lập pipeline tự động: code push → build → test → publish artifact
- **GitHub Actions** (nếu dùng GitHub) hoặc **Gitea Actions** (nếu self-hosted)
- Pipeline riêng cho từng service, chạy song song
- Deploy tự động lên server qua SSH hoặc cập nhật Docker image

**Công nghệ:** GitHub Actions / Gitea Actions, Docker Registry  
**Độ phức tạp:** ⭐⭐⭐⭐☆  
**Ưu tiên:** 🟢 Thấp - Trung bình

---

## 📅 Tổng hợp Lộ trình

```
GIAI ĐOẠN 1 — Production Readiness
├── 1.1  Docker + Docker Compose          ✅ Hoàn thiện
├── 1.2  Centralized Logging (Serilog)    ✅ Hoàn thiện
└── 1.3  Health Check Endpoints           ✅ Hoàn thiện

GIAI ĐOẠN 2 — Nghiệp vụ Mở rộng
├── 2.1  Audit Log UI                     🟠 Trung bình - Cao
├── 2.2  Email / Notification Service     🟠 Trung bình
└── 2.3  File Storage (MinIO)             🟡 Trung bình

GIAI ĐOẠN 3 — Quan sát & Scale
├── 3.1  Rate Limiting tại Gateway        🟡 Trung bình
├── 3.2  Distributed Tracing (OTel)       🟢 Thấp - Trung bình
└── 3.3  CI/CD Pipeline                   🟢 Thấp - Trung bình
```

---

## 🛠 Stack Công nghệ Bổ sung Dự kiến

| Công nghệ | Mục đích | Giai đoạn |
|---|---|---|
| Docker / Docker Compose | Containerization & deployment | 1 |
| Serilog + Seq | Centralized structured logging | 1 |
| AspNetCore.HealthChecks | Service health monitoring | 1 |
| MailKit / SendGrid | Email delivery | 2 |
| MinIO | Self-hosted S3 file storage | 2 |
| OpenTelemetry + Jaeger | Distributed tracing | 3 |
| GitHub/Gitea Actions | CI/CD automation | 3 |

---

> **Nguyên tắc xuyên suốt:** Mọi tính năng mới đều phải tuân thủ Coding Rules & Guidelines đã định nghĩa trong `README.md` gốc — đặc biệt là DRY, Dynamic Design, và cập nhật tài liệu sau mỗi thay đổi.
