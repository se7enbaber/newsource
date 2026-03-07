# Microservices Project - Docker Deployment

Tài liệu này hướng dẫn cách khởi chạy dự án Microservices bằng Docker Compose trong thư mục `Build/Docker`.

## 🏗 Cấu trúc hệ thống (System Architecture)

Dự án bao gồm các thành phần:
- **ERP Postgres**: Cơ sở dữ liệu chính (Database name: `Host`).
- **ERP Administration API**: Dịch vụ quản trị hệ thống (.NET 10).
- **ERP Gateway**: API Gateway điều phối yêu cầu (YARP - .NET 8).
- **ERP SignalR**: Dịch vụ thông báo thời gian thực (.NET 10).
- **ERP Frontend**: Giao diện người dùng (Next.js 14+).

## 🚀 Hướng dẫn khởi chạy (Quick Start)

### 1. Yêu cầu hệ thống
- Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- Đã mở Docker Desktop và đảm bảo Engine đang chạy.

### 2. Các bước thực hiện
Mở terminal (PowerShell hoặc CMD) tại thư mục `Build/Docker` và chạy lệnh:

```powershell
# Chuyển vào thư mục chứa tệp cấu hình
cd d:\App\Project\Build\Docker (hoặc đường dẫn tương ứng)

# Khởi động toàn bộ hệ thống (Lần đầu chạy sẽ mất vài phút để build)
docker compose up -d --build
```

### 3. Kiểm tra trạng thái
```powershell
docker compose ps
```

## 📍 Các địa chỉ truy cập (Access URLs)

| Service | Protocol | Local URL | Port |
| :--- | :--- | :--- | :--- |
| **Frontend** | HTTP | [http://localhost:3001](http://localhost:3001) | 3001 |
| **Gateway (API)** | HTTP | [http://localhost:5002](http://localhost:5002) | 5002 |
| **Admin API (Direct)** | HTTP | [http://localhost:7028/swagger](http://localhost:7028/swagger) | 7028 |
| **SignalR Hub** | HTTP | [http://localhost:5003/notificationHub](http://localhost:5003/notificationHub) | 5003 |
| **PostgreSQL** | TCP | `localhost` | 5433 |

## 🛠 Cấu hình mặc định (Default Config)

- **Database**: `Host`
- **Username**: `postgres`
- **Password**: `123456`
- **Frontend App Port**: `3001`

## 📝 Lưu ý quan trọng
- Khi thay đổi cấu hình dự án, hãy chạy `docker compose up -d --build` để đóng gói lại Image.
- Dữ liệu Database được tự động mount vào thư mục `.docker/db` trong source code để đảm bảo an toàn tuyệt đối, tránh mất mát khi thao tác tắt/mở các services.
- Log của từng dịch vụ có thể xem qua: `docker compose logs -f [service-name]`.
