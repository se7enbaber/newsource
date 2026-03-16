# Cấu trúc thư mục Monorepo

Tài liệu này mô tả cấu trúc thư mục và quy ước đặt tên cho các service chính trong dự án.

---

## 🏗️ AdministrationService

Service lõi xử lý logic nghiệp vụ, xác thực và quản lý dữ liệu.

```
AdministrationService/
├── Controllers/              # Endpoints RESTful, gắn [HasPermission]
├── Infrastructure/
│   ├── Data/                 # DbContext, cấu hình Entity Framework
│   ├── Models/               # EF Core Entities, kế thừa IMultiTenant
│   └── Repositories/         # Data access, kế thừa BaseRepository<T>
├── Services/                 # Business logic, kế thừa BaseService<T, Dto>
├── Tests/
│   ├── Features/             # Unit tests cho các service
│   └── Integration/          # Integration tests cho API controllers
├── Program.cs                # Đăng ký DI, cấu hình middleware pipeline
├── appsettings.json          # Chuỗi kết nối, cấu hình dịch vụ
└── AdministrationService.csproj # File project .NET
```

---

## 📡 SignalRService

Quản lý kết nối real-time (WebSocket) và đẩy thông báo tới client.

```
SignalRService/
├── Hubs/                     # Định nghĩa các SignalR Hubs (vd: NotificationHub)
├── Program.cs                # Cấu hình SignalR, Redis backplane
├── appsettings.json          # Cấu hình Redis connection
└── SignalRService.csproj     # File project .NET
```

---

## 📁 FileService

Middleware xử lý tải lên/tải xuống file, giao tiếp với MinIO (S3).

```
FileService/
├── Controllers/              # API endpoints cho upload/download
├── Services/                 # Logic tương tác với S3 storage (MinIO)
├── Program.cs                # Cấu hình DI, MinIO client
├── appsettings.json          # Cấu hình MinIO (endpoint, access key)
└── FileService.csproj        # File project .NET
```

---

## 🖥️ my-nextjs (Frontend)

Ứng dụng web phía người dùng, xây dựng bằng Next.js App Router.

```
my-nextjs/
├── app/
│   ├── (auth)/               # Route group cho các trang xác thực
│   ├── (dashboard)/          # Route group cho các trang cần đăng nhập
│   │   ├── users/            # Trang quản lý người dùng
│   │   └── _components/      # Components chỉ dùng trong một route
│   ├── api/
│   │   └── proxy/[...path]/  # Route handler forward request tới backend
│   └── layout.tsx            # Layout gốc của ứng dụng
├── components/
│   ├── ui/                   # Component UI cơ bản (Button, Input)
│   └── shared/               # Component nghiệp vụ dùng chung nhiều nơi
├── e2e/                      # End-to-end tests (Playwright)
├── lib/                      # Các hàm helper dùng chung (api, auth)
├── types/
│   └── dto/                  # Định nghĩa TypeScript cho DTO từ backend
├── next.config.js            # Cấu hình Next.js
└── package.json              # Quản lý dependencies và scripts
```

---

## 📝 Quy ước đặt tên

- **Backend (.NET)**: Tuân thủ kiến trúc lớp `Controller` -> `Service` -> `Repository`. Các lớp nghiệp vụ được đặt tên theo hậu tố tương ứng (ví dụ: `UserService`, `UserRepository`). DTOs được đặt tên theo mục đích (`CreateUserDto`, `UserDto`).
- **Frontend (Next.js)**: Sử dụng App Router với các file quy ước (`page.tsx`, `layout.tsx`). Các route group `(group)` được dùng để tổ chức layout. Component dùng riêng cho một route được đặt trong thư mục `_components`.
- **API Proxy**: Mọi request từ client ra bên ngoài đều đi qua một route handler duy nhất tại `app/api/proxy/[...path]/route.ts`.