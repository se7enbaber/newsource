# 🐳 Tài Liệu Docker Toàn Tập (Consolidated Docker Guide)

Tài liệu này tổng hợp thông tin từ tất cả các hướng dẫn Docker trong dự án, bao gồm cấu trúc, cách khởi chạy, quản lý và các lưu ý quan trọng.

---

## 🏗 1. Cấu Trúc Hệ Thống (Architecture)

Hệ thống được thiết kế theo kiến trúc Microservices, bao gồm:
- **ERP Postgres**: Cơ sở dữ liệu chính (PostgreSQL 16).
- **ERP Administration API**: Dịch vụ quản trị lõi (.NET 10).
- **ERP Gateway**: Cổng API Gateway điều phố y (YARP - .NET 8).
- **ERP SignalR**: Dịch vụ thông báo thời gian thực (.NET 10).
- **ERP Frontend**: Giao diện người dùng (Next.js 14+).
- **Logging Hub (Seq)**: Quản lý log tập trung (Cổng 5341).

### 📁 Cấu Trúc File Docker
```text
Project Root/
├── docker-compose.yml              ← Cấu hình chính (Môi trường Production)
├── docker-compose.dev.yml          ← Cấu hình phát triển (Hỗ trợ Hot Reload)
├── .env                            ← Biến môi trường tập trung (Source of Truth)
├── .env.example                    ← File mẫu cho environment variables
├── .dockerignore                   ← Tối ưu build context cho từng service
│
├── [Service Name]/
│   ├── Dockerfile                  ← Multi-stage build (.NET 10 / Node.js)
│   └── .dockerignore               ← Loại bỏ files rác khỏi build context
```

---

## 🚀 2. Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### Bước 1: Chuẩn bị file .env
Copy file mẫu và điền thông tin (đặc biệt là mật khẩu Database và JWT Secrets):
```bash
cp .env.example .env
```

### Bước 2: Build Images
```bash
docker compose build
```

### Bước 3: Khởi động hệ thống
```bash
# Chạy ở chế độ background
docker compose up -d

# Xem trạng thái các container
docker compose ps
```

### 📍 Các địa chỉ truy cập (Access URLs)

| Service | Host Port | Internal Port | URL |
| :--- | :--- | :--- | :--- |
| **Frontend** | 3001 | 3000 | [http://localhost:3001](http://localhost:3001) |
| **Gateway** | 5002 | 8080 | [http://localhost:5002](http://localhost:5002) |
| **Admin API** | 7028 | 8080 | [http://localhost:7028/swagger](http://localhost:7028/swagger) |
| **SignalR Hub** | 5003 | 8080 | [http://localhost:5003/notificationHub](http://localhost:5003/notificationHub) |
| **PosrgreSQL** | 5433 | 5432 | `localhost:5433` |
| **Seq (Log)** | 5341 | 5341 | [http://localhost:5341](http://localhost:5341) |

---

## ⚙️ 3. Cấu Hình & Biến Môi Trường

Hệ thống sử dụng file `.env` tập trung để mapping cấu hình động.

### ⚠️ Lưu ý QUAN TRỌNG:
1. **Mật khẩu Database**: Thay đổi `DB_PASSWORD` trong file `.env` ngay lập tức.
2. **Ports**: Nếu port máy host đã bị sử dụng (vd: 5433), hãy thay đổi `PORT_POSTGRES` trong file `.env`.
3. **Frontend URLs**: Container Frontend gọi Gateway qua mạng nội bộ Docker (`http://gateway:8080`).

---

## 📋 4. Các Lệnh Quản Trị Hữu Ích

### Quản lý Container
- `docker compose stop`: Dừng các dịch vụ (giữ lại container).
- `docker compose down`: Dừng và xóa containers + networks.
- `docker compose down -v`: Xóa cả containers và Volumes (⚠️ **MẤT DỮ LIỆU DB**).
- `docker compose restart [service]`: Khởi động lại một dịch vụ cụ thể.

### Xem Log
- `docker compose logs -f`: Xem log tất cả các dịch vụ (real-time).
- `docker compose logs -f admin-service`: Chỉ xem log của Administration API.

### Database (Backup/Restore)
- **Backup**:
  ```bash
  docker compose exec postgres pg_dump -U postgres Host > backup.sql
  ```
- **Restore**:
  ```bash
  docker compose exec -T postgres psql -U postgres Host < backup.sql
  ```

---

## 🛠 5. Best Practices & Bảo Mật

Dự án đã áp dụng các tiêu chuẩn an toàn:
1. **Multi-stage Builds**: Giảm kích thước bộ nhớ image, loại bỏ mã nguồn khỏi image cuối.
2. **Non-root Users**: Các dịch vụ đều chạy dưới quyền user giới hạn (UID 1000/1001).
3. **Health Checks**: Tự động phát hiện và khởi động lại container khi bị lỗi treo.
4. **Layer Caching**: Tối ưu hóa file `.csproj` và `package.json` để build cực nhanh.
5. **Named Volumes**: Dữ liệu DB được lưu trữ bền vững tại `.docker/db` của host.

---

## ❌ 6. Xử Lý Sự Cố (Troubleshooting)

- **Lỗi Port already allocated**: Kiểm tra `netstat -ano | findstr :[PORT]` và đổi port trong `.env`.
- **Lỗi Npgsql Name or service not known**: Trong Docker, `localhost` trỏ về chính container đó. Hệ thống đã có logic tự động chuyển `localhost` thành `postgres` khi phát hiện biến `DOTNET_RUNNING_IN_CONTAINER=true`. Đảm bảo biến này có trong file `docker-compose.yml`.
- **Frontend PostCSS Error**: Chạy `npm install` và `npm run build` trên host máy để đảm bảo toolchain Next.js hoạt động đúng.
- **Connection Timeout**: Kiểm tra xem container `postgres` đã hoàn thành khởi động (Healthy status) chưa bằng lệnh `docker compose ps`.

---
*Cập nhật: 06/03/2026*
