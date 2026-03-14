# CONTEXT & ARCHITECTURE

## 🏗 Sơ đồ Kiến trúc (ASCII)

```text
┌────────────────────────┐         ┌────────────────────────┐
│ Trình duyệt (Người dùng)│  HTTP   │ Next.js Server (Proxy) │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            ▼                                  ▼
┌───────────────────────────────────────────────────────────┐
│                   Gateway Service (YARP)                  │
│                     (Port 5000/5001)                      │
└──────┬──────────────────────────┬──────────────┬──────────┘
       │ /notificationHub         │ /api/**      │ /files/**
       ▼                          ▼              ▼
┌─────────────┐  HTTP   ┌──────────────────┐  ┌──────────────────┐
│SignalR Svc  │◄────────│Administration Svc│  │  File Service    │
│(WebSocket)  │  POST   │  (Core API)      │  │  (Upload/Download)│
│(Port: 5200) │         │  (Port: 7027/5000)│ │  (Port: 8080)    │
└──────┬──────┘         └────────┬────┬────┘  └────────┬─────────┘
       │                         │    │                │
       │         Distributed     │    │ EF Core        │ S3 API
       └────────► Cache (Redis) ◄┘    ▼                ▼
       (Port: 6379)            ┌──────────────┐      ┌──────────────────┐
                               │   Database   │      │      Minio       │
                               │ (PostgreSQL) │      │ (Port: 9000/9001)│
                               └──────────────┘      └──────────────────┘
```

## 🔌 Danh sách Services & Tính năng

| Service | Real Port(s) | Role (Vai trò thực tế) | Tech |
|---|---|---|---|
| `AdministrationService` | 7027 | Xử lý Core Logic (RESTful APIs), xác thực OIDC (OpenIddict), Identity Management, xử lý AuthZ động, Audit Logging. Cung cấp API trực tiếp tới Gateway. | .NET 10 (EF Core) |
| `GatewayService` | 5000 | Reverse Proxy. Phân luồng tới API (cho `/api/**`, `/connect/**`, SignalR Hub). Quản lý CORS trung tâm, bảo mật & bypass SSL LAN local. | .NET 10, YARP |
| `SignalRService` | 5200 | Kênh nhận notification real-time (WebSocket). Kết nối AdministrationService thông qua bus message là `Redis`. | .NET 10 |
| `my-nextjs` | 3000/3001 | Front-end Web App cung cấp UI, App Router gọi proxy `/api/proxy` (nextjs backend) rồi route qua HTTP/Next sang GatewayService. | Next.js 16 |
| `FileService` | 8080 | Middleware tải/quản lý file từ Frontend giao tiếp với S3 Protocol của MinIO; phân tách Storage Bucket theo id của Tenant. | .NET 10, MinIO |
| `Redis` | 6379 | In-memory Database cho tính năng phân quyền cache (Role Claims), Message Backplane cho SignalR, caching token session. | Redis 7+ |
| `Postgres` | 5432 | Primary RDBMS cấp Master, lưu trữ Tenants. Support kết hợp isolated Database Schema SQL/PG/MySQL. | Postgres 16+ |

---

> [!NOTE]
> **Infrastructure Stability**: Hệ thống hiện tại sử dụng **Standard .NET Runtime** (Không dùng Native AOT) để đảm bảo khả năng tương thích tối đa với EF Core Reflection (Global Query Filters), Hangfire, và các thư viện Identity. Docker images sử dụng `aspnet:10.0` (Ubuntu/Alpine) kèm các thư viện hệ thống cần thiết như `libgssapi-krb5-2`.

---

## 🔁 Các luồng dữ liệu chính thực tế (Data Flows)

### 1. Luồng Request Cơ Bản từ Trình Duyệt:
Client Component (`react`) -> `/api/proxy/[...path]` của Next.js -> `BACKEND_URL` = `GatewayService` tại cổng 5000 -> YARP filter và map Route -> Trả đến `AdministrationService` Endpoint 7027.
**Lý do**: Next.js Node Proxy Server call HTTP tránh hoàn toàn lỏng lẻo CORS và certificate policies từ client-side.

### 2. Luồng Authentication & Authorization:
- Login POST -> Gateway -> `AdministrationService/connect/token` (OpenIddict Issuer) -> Xác minh DB & sinh JWT.
- Khi cấp Token thành công, `AdministrationService` cache lại danh sách Roles và Permission tương ứng của User lên **Redis**.
- API Requests sau đó truyền `Authorization: Bearer <JWT>`, Middleware tại Backend giải mã JWT và thực thi `[HasPermission]`.

### 3. Luồng Multi-Tenant:
- Token gắn kèm Header hoặc Claim (`tenant_id`).
- Khi call API, `TenantService` trích xuất `tenant_id` từ HttpContext.
- EF Core `ApplicationDbContext` nhận Provider Scope có chứa Interface `ITenantProvider`, dynamic mapping trỏ `DbContextOptionsBuilder` tới chuỗi kết nối (`ConnectionString` hoặc loại Database: MySQL/Postgres) riêng biệt cho Tenant ID đó.
- Nếu không có ConnectionString chỉ định riêng, Tenant Query được tự động lọc cô lập bằng `HasQueryFilter(u => u.TenantId == tenant_id)` để đảm bảo an toàn cho dữ liệu dùng chung (Shared Database).

### 4. Luồng Logging & Health-check:
- Từng Service như `FileService`, `AdministrationService` và `GatewayService` đều push Telemetry Logs lên **Seq** Server (Serilog configuration) (Cổng 5341). ASP.NET Core Push Health states tới `AspNetCore.HealthChecks.UI` để có thể theo dõi "sống/chết" trực quan.

### 5. Luồng Scheduled Jobs & Migrations:
- Worker process (Hangfire) chạy ngầm bên trong `AdministrationService`.
- Quét các Tenant isolated schema, chuyển context và chạy lệnh `ApplyMigrationsAsync()` trực tiếp xuống cơ sở dữ liệu.
- Kích hoạt HTTP POST âm thầm tới `SignalRService` để push websocket notification phản hồi trạng thái hoàn tất về Next.js Client Dashboard.
