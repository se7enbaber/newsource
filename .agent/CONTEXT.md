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
│                     (Host Port: 5002)                     │
└──────┬──────────────────────────┬──────────────┬──────────┘
       │ /notificationHub         │ /api/**      │ /files/**
       ▼                          ▼              ▼
┌─────────────┐  HTTP   ┌──────────────────┐  ┌──────────────────┐
│SignalR Svc  │◄────────│Administration Svc│  │  File Service    │
│(WebSocket)  │  POST   │  (Core API)      │  │  (Upload/Download)│
│(Port: 10000)│         │(Host Port: 7038) │  │  (Port: 8080)    │
└──────┬──────┘         └────────┬────┬────┘  └────────┬─────────┘
       │                         │    │                │
       │ Backplane only          │    │ EF Core        │ S3 API
       ▼                         │    ▼                ▼
┌─────────────────┐  Perm cache  │ ┌──────────────┐  ┌──────────────────┐
│  Redis          │◄─────────────┘ │   Database   │  │      Minio       │
│  (Port: 6379)   │                │ (PostgreSQL) │  │ (Port: 9000/9001)│
└─────────────────┘                └──────────────┘  └──────────────────┘

⚠️  SignalR chỉ kết nối Redis (backplane đồng bộ message giữa các instance).
    SignalR KHÔNG kết nối trực tiếp PostgreSQL.
```

## 🔌 Danh sách Services & Tính năng

| Service | Real Port(s) | Role (Vai trò thực tế) | Tech |
|---|---|---|---|
| `AdministrationService` | 7038 | Xử lý Core Logic (RESTful APIs), xác thực OIDC (OpenIddict), Identity Management, xử lý AuthZ động, Audit Logging. Cung cấp API trực tiếp tới Gateway. | .NET 10 (EF Core) |
| `GatewayService` | 5002 | Reverse Proxy. Phân luồng tới API (cho `/api/**`, `/connect/**`, SignalR Hub). Quản lý CORS trung tâm, bảo mật & bypass SSL LAN local. | .NET 10, YARP |
| `SignalRService` | 10000 | Kênh nhận notification real-time (WebSocket). Nhận HTTP POST từ `AdministrationService`, dùng `Redis` làm backplane đồng bộ message giữa các instance. **Không kết nối trực tiếp PostgreSQL.** | .NET 10 |
| `my-nextjs` | 3011 | Front-end Web App cung cấp UI, App Router gọi proxy `/api/proxy` (nextjs backend) rồi route qua HTTP/Next sang GatewayService. | Next.js 16 |
| `FileService` | 8080 | Middleware tải/quản lý file từ Frontend giao tiếp với S3 Protocol của MinIO; phân tách Storage Bucket theo id của Tenant. | .NET 10, MinIO |
| `Redis` | 6379 | In-memory Database cho tính năng phân quyền cache (Role Claims), Message Backplane cho SignalR, caching token session. | Redis 7+ |
| `Postgres` | 5443 | Primary RDBMS cấp Master, lưu trữ Tenants. Support kết hợp isolated Database Schema SQL/PG/MySQL. | Postgres 16+ |
| `Seq` | 5341 | UI tập trung cho Serilog logging. Xem log tại http://localhost:5341 | Datalust Seq |

> [!WARNING]
> **Host Port Stability**: Tuyệt đối không thay đổi Host Port (cổng thực tế bên ngoài) của các service trong `docker-compose.yml` và `.env`. Mọi thay đổi port sẽ làm hỏng cấu hình Gateway (YARP), Hub Connection, và môi trường Debug của Team.

---

> [!NOTE]
> **Infrastructure Stability**: Hệ thống hiện tại sử dụng **Standard .NET Runtime** (Không dùng Native AOT) để đảm bảo khả năng tương thích tối đa với EF Core Reflection (Global Query Filters), Hangfire, và các thư viện Identity. Docker images sử dụng `aspnet:10.0` (Ubuntu/Alpine) kèm các thư viện hệ thống cần thiết như `libgssapi-krb5-2`.

---

## 🔁 Các luồng dữ liệu chính thực tế (Data Flows)

### 1. Luồng Request Cơ Bản từ Trình Duyệt:
Client Component (`react`) -> `/api/proxy/[...path]` của Next.js -> `BACKEND_URL` = `GatewayService` tại cổng 5002 -> YARP filter và map Route -> Trả đến `AdministrationService` Endpoint 8080 (Container Port).
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