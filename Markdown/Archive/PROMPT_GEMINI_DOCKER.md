# 📋 Prompt cho Gemini — Tạo Dockerfile & docker-compose.yml

> Copy toàn bộ nội dung bên dưới và paste vào Gemini.

---

## PROMPT

```
Bạn là một DevOps Engineer chuyên về Docker và .NET microservices.
Hãy tạo các file Dockerfile và docker-compose.yml cho dự án của tôi theo đúng thông tin bên dưới.

---

## THÔNG TIN DỰ ÁN

Dự án là một hệ thống quản trị multi-tenant gồm các service sau:

| Thư mục | Loại | Công nghệ | Port nội bộ |
|---|---|---|---|
| `AdministrationService/` | Backend API chính | .NET 10, ASP.NET Core, EF Core, PostgreSQL | 8080 |
| `GatewayService/` | API Gateway Reverse Proxy (YARP) | .NET 8 | 8080 |
| `SignalRService/` | WebSocket / Real-time Notification | .NET 10, ASP.NET Core SignalR | 8080 |
| `my-nextjs/` | Frontend Web App | Next.js 14+, TypeScript, App Router | 3000 |

**Cấu trúc thư mục gốc:**
```
Project/
├── AdministrationService/
│   └── AdministrationService.csproj  (hoặc tên tương tự)
├── GatewayService/
│   └── GatewayService.csproj
├── SignalRService/
│   └── SignalRService.csproj
├── my-nextjs/
│   ├── package.json
│   └── next.config.ts
└── docker-compose.yml  ← tạo ở đây
```

**Database:** PostgreSQL 16 (dùng container, không cài ngoài)

**Môi trường deploy:** Windows Server on-premise (Docker Desktop hoặc Docker Engine trên Windows)

---

## YÊU CẦU CỤ THỂ

### 1. Dockerfile cho AdministrationService (.NET 10)
- Dùng multi-stage build: stage `build` dùng `mcr.microsoft.com/dotnet/sdk:10.0`, stage `final` dùng `mcr.microsoft.com/dotnet/aspnet:10.0`
- WORKDIR `/src` lúc build, `/app` lúc chạy
- Copy toàn bộ source → restore → publish Release → copy sang stage final
- EXPOSE 8080
- ENTRYPOINT chạy file .dll của service

### 2. Dockerfile cho GatewayService (.NET 8)
- Tương tự AdministrationService nhưng dùng SDK và runtime .NET 8
- `mcr.microsoft.com/dotnet/sdk:8.0` và `mcr.microsoft.com/dotnet/aspnet:8.0`

### 3. Dockerfile cho SignalRService (.NET 10)
- Tương tự AdministrationService, dùng .NET 10
- Lưu ý: service này cần hỗ trợ WebSocket — thêm comment nhắc cấu hình `ASPNETCORE_URLS` nếu cần

### 4. Dockerfile cho my-nextjs (Next.js)
- Dùng multi-stage build 3 bước: `deps` → `builder` → `runner`
- Stage `deps`: `node:20-alpine`, cài npm dependencies
- Stage `builder`: copy deps, copy source, chạy `npm run build`
- Stage `runner`: `node:20-alpine`, chỉ copy `.next`, `node_modules`, `package.json`, `public`
- EXPOSE 3000
- CMD `["npm", "start"]`
- Thêm ENV `NODE_ENV=production`

### 5. docker-compose.yml (file tổng hợp ở thư mục gốc)
Yêu cầu:
- Version `3.9`
- Các services: `postgres`, `admin-service`, `gateway`, `signalr`, `frontend`
- Service `postgres`:
  - Image `postgres:16`
  - Có volume `postgres-data` để dữ liệu bền vững
  - Env: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
  - Port `5432:5432`
  - `restart: unless-stopped`
  - Có healthcheck để các service khác biết khi nào DB sẵn sàng

- Service `admin-service`:
  - Build từ `./AdministrationService`
  - Port `7027:8080`
  - Env: ASPNETCORE_ENVIRONMENT=Production, ConnectionStrings__Default trỏ vào postgres container
  - `depends_on` postgres với condition `service_healthy`
  - `restart: unless-stopped`

- Service `gateway`:
  - Build từ `./GatewayService`
  - Port `5000:8080`
  - `depends_on` admin-service
  - `restart: unless-stopped`
  - Env trỏ upstream về `http://admin-service:8080`

- Service `signalr`:
  - Build từ `./SignalRService`
  - Port `5001:8080`
  - `depends_on` admin-service
  - `restart: unless-stopped`

- Service `frontend`:
  - Build từ `./my-nextjs`
  - Port `3000:3000`
  - Env: BACKEND_URL=`http://gateway:8080`, NODE_ENV=production
  - `depends_on` gateway
  - `restart: unless-stopped`

- Có `networks` nội bộ `app-network` để các container giao tiếp với nhau
- Có `volumes` định nghĩa `postgres-data`

---

## YÊU CẦU CHUNG

- Mỗi Dockerfile đặt trong thư mục của service tương ứng
- Thêm comment tiếng Việt giải thích từng bước quan trọng trong file
- Các biến nhạy cảm (password, connection string) dùng biến môi trường, không hard-code
- Thêm file `.dockerignore` mẫu cho từng loại service (.NET và Next.js)
- Cuối cùng, liệt kê các lệnh docker compose hay dùng nhất kèm giải thích ngắn

---

## ĐẦU RA MONG MUỐN

Xuất lần lượt theo thứ tự:
1. `AdministrationService/Dockerfile`
2. `AdministrationService/.dockerignore`
3. `GatewayService/Dockerfile`
4. `GatewayService/.dockerignore`
5. `SignalRService/Dockerfile`
6. `SignalRService/.dockerignore`
7. `my-nextjs/Dockerfile`
8. `my-nextjs/.dockerignore`
9. `docker-compose.yml` (thư mục gốc)
10. Bảng lệnh docker compose hay dùng

Mỗi file xuất trong code block riêng, có tiêu đề rõ ràng.
```

---

## 💡 Lưu ý khi dùng prompt này

**Nếu Gemini hỏi thêm về tên file .csproj:**
> Trả lời: Tên file .csproj giống tên thư mục, ví dụ `AdministrationService.csproj`, `GatewayService.csproj`, `SignalRService.csproj`

**Nếu Gemini hỏi về version Next.js cụ thể:**
> Trả lời: Next.js 14 hoặc 15, dùng App Router, có file `next.config.ts`

**Sau khi nhận kết quả:**
1. Copy từng file vào đúng thư mục trong dự án
2. Chạy thử: `docker compose up -d`
3. Kiểm tra: `docker compose ps` — tất cả service phải ở trạng thái `Up`
