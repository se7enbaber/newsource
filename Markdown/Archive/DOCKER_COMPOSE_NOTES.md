# ⚠️ Những Lưu Ý Trước Khi Chạy Docker Compose

## 1. **PostgreSQL - Mật Khẩu Mặc Định**
```yaml
POSTGRES_USER: "postgres"
POSTGRES_PASSWORD: "123456"  # ⚠️ KHÔNG PHẢI BẢO MẬT!
```
**Vấn đề:** Mật khẩu `123456` rất yếu và không an toàn cho production.

**Cách sửa:**
- Tạo file `.env` ở thư mục gốc:
```env
POSTGRES_PASSWORD=your-strong-password-here-minimum-12-chars
```
- Hoặc sửa trực tiếp trong `docker-compose.yml`:
```yaml
environment:
  POSTGRES_PASSWORD: "YourSecurePassword123!@#"
```

**Quan trọng:** Thay đổi mật khẩu này và cập nhật trong `ConnectionStrings__DefaultConnection` của các dịch vụ .NET.

---

## 2. **Cấu Hình Kết Nối Database trong .NET Services**
```yaml
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=Host;Username=postgres;Password=123456
```

**Vấn đề:** Nếu bạn thay đổi mật khẩu PostgreSQL, bạn **PHẢI cập nhật** mật khẩu này trong các service:
- `admin-service`
- `gateway` (nếu có)
- `signalr` (nếu có)

**Cách sửa:**
```yaml
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=Host;Username=postgres;Password=your-new-password
```

---

## 3. **Cấu Hình Frontend URLs**
```yaml
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5002/notificationHub
```

**Vấn đề:** `localhost:5002` **chỉ hoạt động khi** truy cập từ máy host. 
- Trên **browser localhost** ✅: Hoạt động
- Từ **container khác**: ❌ Sẽ thất bại (phải dùng tên service hoặc IP của container)

**Cách sửa cho development:**
```yaml
NEXT_PUBLIC_SIGNALR_URL=/notificationHub  # Relative URL
# Hoặc dùng docker network
NEXT_PUBLIC_SIGNALR_URL=http://gateway:8080/notificationHub
```

---

## 4. **Ports Đã Sử Dụng**
```
5433  → PostgreSQL (mặc định: 5432)
7028  → Admin Service API (HTTP: 8080 trong container)
5002  → Gateway (HTTP: 8080 trong container)
5003  → SignalR Service (HTTP: 8080 trong container)
3001  → Frontend (HTTP: 3000 trong container)
```

**Kiểm tra:** Các port này đã bị chiếm?
```bash
# Windows - PowerShell (admin)
netstat -ano | findstr :5433
netstat -ano | findstr :7028

# Linux/Mac
lsof -i :5433
lsof -i :7028
```

Nếu có xung đột, thay đổi ports trong `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"  # Thay 5433 thành 5434
```

---

## 5. **Frontend Build Error - PostCSS/Tailwind**
```
Error: Cannot find module 'tailwindcss'
```

**Vấn đề:** Dự án Next.js có cấu hình Tailwind nhưng có lỗi trong `postcss.config.mjs` hoặc `tailwind.config.ts`.

**Cách sửa:**
```bash
# Tạo container tạm để debug
docker run -it -v .:/app node:20-alpine sh
cd /app/my-nextjs
npm install
npm run build

# Hoặc fix trực tiếp trên máy host
cd my-nextjs
npm install
npm run build
```

Nếu vẫn lỗi, có thể:
1. Cập nhật dependencies: `npm install --save-dev tailwindcss postcss autoprefixer`
2. Hoặc tạo lại config: `npx tailwindcss init -p`

---

## 6. **Resource Limits**
```yaml
deploy:
  resources:
    limits:
      cpus: '1.5'
      memory: 1G
    reservations:
      cpus: '0.75'
      memory: 512M
```

**Lưu ý:** Resource limits **chỉ hoạt động trên Docker Swarm hoặc Kubernetes**.

Trên **Docker Desktop (standalone mode)**, cần cấu hình trong Docker Desktop app:
- Settings → Resources → CPU & Memory limits

---

## 7. **Volume Persistence**
```yaml
volumes:
  postgres-data:
    driver: local
```

Dữ liệu PostgreSQL **được lưu** trong named volume `postgres-data`.

**Cách backup/restore:**
```bash
# Backup database
docker compose exec postgres pg_dump -U postgres Host > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres Host < backup.sql

# Xóa volume (⚠️ MẤT DỮ LIỆU!)
docker compose down -v
```

---

## 8. **Health Checks**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

**Tác dụng:** Tự động kiểm tra và khởi động lại container nếu unhealthy.

**Kiểm tra status:**
```bash
docker compose ps
# Sẽ hiển thị: (healthy), (unhealthy), hoặc (starting)
```

---

## 9. **Network Configuration**
```yaml
networks:
  app-network:
    driver: bridge
```

**Service networking:**
- `admin-service:8080` - Từ gateway có thể gọi: `http://admin-service:8080`
- Không cần expose port nếu chỉ gọi giữa containers
- Port mapping (ví dụ: `5433:5432`) **chỉ dùng từ host machine**

---

## 10. **Non-Root User**
```yaml
user: "1000:1000"  # admin-service, gateway, signalr
user: "1001:1001"  # frontend
```

**Lưu ý:** Nếu gặp lỗi permission khi viết file trong container:
```bash
# Kiểm tra ownership
docker compose exec admin-service ls -la /app

# Nếu cần sửa (chạy tạm với root)
docker compose exec -u root admin-service chown -R 1000:1000 /app
```

---

## 11. **Dependency Order**
```yaml
admin-service:
  depends_on:
    postgres:
      condition: service_healthy  # Chờ PostgreSQL sẵn sàng

gateway:
  depends_on:
    admin-service:
      condition: service_started  # Chỉ chờ khởi động, chưa cần healthy
```

**Vấn đề:** `service_started` **không đảm bảo** service đã sẵn sàng.

**Cách tốt hơn:** Thêm health check vào tất cả services:
```yaml
admin-service:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
    interval: 10s
    timeout: 5s
    retries: 3

gateway:
  depends_on:
    admin-service:
      condition: service_healthy  # Đợi health check pass
```

---

## 12. **Development vs Production**
```bash
# Development (với hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker compose up -d

# Production với scale
docker compose up -d --scale admin-service=3
```

---

## 🚀 Quick Start Checklist

- [ ] Đã cập nhật mật khẩu PostgreSQL trong `.env` hoặc `docker-compose.yml`?
- [ ] Các ports 5433, 7028, 5002, 5003, 3001 không bị chiếm?
- [ ] Next.js frontend build fix PostCSS errors?
- [ ] `.NET services` rebuild sau khi sửa connection strings?
- [ ] Docker Desktop có đủ resources (CPU: 2+, Memory: 4GB+)?
- [ ] Kiểm tra firewall không chặn ports?

---

## 📋 Commands Cơ Bản

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Clean up (⚠️ MẤT DỮ LIỆU!)
docker compose down -v

# Execute command in container
docker compose exec admin-service dotnet --version

# View services status
docker compose ps
```

---

## 🔧 Troubleshooting

```bash
# Nếu port bị chiếm
Error: Bind for 0.0.0.0:5433 failed: port is already allocated
→ Thay đổi port mapping trong docker-compose.yml

# Nếu container không khởi động
docker compose logs postgres
→ Kiểm tra error message

# Nếu frontend không kết nối được backend
docker compose exec frontend curl http://gateway:8080
→ Test kết nối mạng giữa containers

# Xóa volume và start lại
docker compose down -v && docker compose up -d
→ Reset toàn bộ dữ liệu
```

---

**⚠️ QUAN TRỌNG:** Hãy xem xét file này trước khi chạy `docker compose up` để tránh lỗi sau này!
