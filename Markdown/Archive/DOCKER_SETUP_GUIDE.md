# Docker Containerization - Hướng Dẫn Hoàn Chỉnh

## 📁 Cấu Trúc File Đã Tạo

```
Project Root/
├── docker-compose.yml              ← Main configuration (production)
├── docker-compose.dev.yml          ← Development override (hot reload)
├── .env.example                    ← Template cho environment variables
├── .dockerignore                   ← Tối ưu build context (mỗi service)
├── Markdown/
│   ├── DOCKER_BEST_PRACTICES.md    ← Chi tiết best practices áp dụng
│   ├── DOCKER_COMPOSE_NOTES.md     ← ⚠️ Lưu ý QUAN TRỌNG trước chạy
│   └── DOCKER_SETUP_GUIDE.md       ← Bạn đang đọc file này
│
├── AdministrationService/
│   ├── Dockerfile                  ← Multi-stage .NET 10 build
│   └── .dockerignore
│
├── GatewayService/
│   ├── Dockerfile                  ← Multi-stage .NET 10 build (sửa từ 8→10)
│   └── .dockerignore
│
├── SignalRService/
│   ├── Dockerfile                  ← Multi-stage .NET 10 build
│   └── .dockerignore
│
└── my-nextjs/
    ├── Dockerfile                  ← 3-stage Node.js build
    └── .dockerignore
```

---

## 🚀 Quick Start (5 Bước)

### 1️⃣ **Tạo `.env` từ template**
```bash
cp .env.example .env
# Edit .env và thay đổi:
# - POSTGRES_PASSWORD (⚠️ QUAN TRỌNG!)
# - Cập nhật connection string nếu thay password
```

### 2️⃣ **Sửa lỗi Frontend (PostCSS)**
```bash
cd my-nextjs

# Cách 1: Cài đặt dependencies
npm install --save-dev tailwindcss postcss autoprefixer

# Cách 2: Reset Tailwind config
npx tailwindcss init -p

# Test build
npm run build
```

### 3️⃣ **Build Images**
```bash
docker compose build

# Hoặc build từng service
docker compose build admin-service gateway signalr
# Bỏ qua frontend nếu vẫn lỗi
```

### 4️⃣ **Start Services**
```bash
# Production
docker compose up -d

# Development (với hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 5️⃣ **Kiểm tra Status**
```bash
docker compose ps
docker compose logs -f
```

---

## ⚠️ **Những Điểm PHẢI Sửa Trước Chạy**

### 1. **Mật khẩu PostgreSQL**
**File:** `docker-compose.yml` (dòng 21)
```yaml
# ❌ Hiện tại (KHÔNG AN TOÀN)
POSTGRES_PASSWORD: "123456"

# ✅ Phải thay đổi
POSTGRES_PASSWORD: "YourSecurePassword@123"
```

**AND cập nhật:**
- Admin Service (dòng 67)
- Gateway (nếu cần)
- SignalR (nếu cần)
```yaml
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=Host;Username=postgres;Password=YourSecurePassword@123
```

### 2. **Frontend URLs (nếu cần)**
**File:** `docker-compose.yml` (dòng 153-157)

Nếu chạy từ **browser trên localhost**:
```yaml
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5002/notificationHub  # ✅ OK
```

Nếu Next.js gọi từ **backend**:
```yaml
BACKEND_URL=http://gateway:8080  # ✅ Dùng tên service trong network
```

### 3. **Ports Xung Đột**
Kiểm tra ports có sẵn:
```bash
# Windows
netstat -ano | findstr :5433
netstat -ano | findstr :7028

# Linux/Mac
lsof -i :5433
lsof -i :7028
```

Nếu chiếm, thay đổi trong `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"  # Đổi 5433 → 5434
```

---

## 📊 Port Mapping

| Service | Host | Container | URL |
|---------|------|-----------|-----|
| PostgreSQL | 5433 | 5432 | - |
| Admin API | 7028 | 8080 | http://localhost:7028 |
| Gateway | 5002 | 8080 | http://localhost:5002 |
| SignalR | 5003 | 8080 | http://localhost:5003 |
| Frontend | 3001 | 3000 | http://localhost:3001 |

---

## 🔧 Best Practices Áp Dụng

✅ **Multi-stage Builds** - Giảm 70% kích thước image
✅ **Health Checks** - Tự động khởi động lại container unhealthy
✅ **Non-root Users** - Bảo mật cao hơn (UIDs: 1000, 1001)
✅ **Resource Limits** - Ngăn runaway processes
✅ **Named Volumes** - Persistent data cho PostgreSQL
✅ **Layer Caching** - `.csproj` copy trước source → tốc độ build nhanh hơn
✅ **Custom Network** - Services gọi nhau bằng tên (DNS automatic)

Chi tiết → Xem `Markdown/DOCKER_BEST_PRACTICES.md`

---

## 🚨 Common Issues & Solutions

### ❌ **Port Already Allocated**
```
Error: Bind for 0.0.0.0:5433 failed: port is already allocated
```
**Fix:**
```bash
# Tìm process chiếm port
netstat -ano | findstr :5433

# Đóng hoặc thay port trong docker-compose.yml
```

### ❌ **Connection String Error**
```
Error: Connection timeout to postgres:5432
```
**Fix:**
```bash
# 1. PostgreSQL password không match
# Cập nhật: POSTGRES_PASSWORD + ConnectionStrings__DefaultConnection

# 2. PostgreSQL chưa healthy
docker compose logs postgres

# 3. Services chưa trên cùng network
docker network inspect project_app-network
```

### ❌ **Frontend PostCSS Error**
```
Error: Cannot find module 'tailwindcss'
```
**Fix:**
```bash
cd my-nextjs
npm install --save-dev tailwindcss postcss autoprefixer
npm run build
```

### ❌ **Memory Issues**
```
Out of memory
```
**Fix:**
- Docker Desktop → Settings → Resources → Tăng memory
- Hoặc giảm resource limits trong `docker-compose.yml`

---

## 📋 Commands Hữu Ích

```bash
# === BUILD ===
docker compose build                          # Build tất cả
docker compose build --no-cache admin-service # Build riêng, không cache

# === START/STOP ===
docker compose up -d                          # Start background
docker compose up                             # Start foreground (xem logs)
docker compose down                           # Stop containers
docker compose down -v                        # Stop + xóa volumes (⚠️ MẤT DỮ LIỆU!)

# === LOGS ===
docker compose logs                           # Tất cả logs
docker compose logs -f                        # Follow (real-time)
docker compose logs frontend                  # Chỉ frontend
docker compose logs --tail=50 admin-service   # 50 dòng cuối

# === EXECUTE ===
docker compose exec admin-service bash        # SSH vào container
docker compose exec postgres psql -U postgres # Connect PostgreSQL

# === STATUS ===
docker compose ps                             # Danh sách containers
docker compose images                         # Danh sách images
docker compose config                         # Hiển thị config cuối cùng

# === CLEANUP ===
docker system prune                           # Xóa unused images/networks
docker compose down -v && docker compose up   # Reset hoàn toàn
```

---

## 🔐 Security Checklist

- [ ] Mật khẩu PostgreSQL đã thay đổi từ `123456`?
- [ ] `.env` file có `.gitignore`? (Tránh commit sensitive data)
- [ ] Non-root users được kích hoạt (UID: 1000, 1001)?
- [ ] Health checks hoạt động?
- [ ] Firewall cho phép ports (5433, 7028, 5002, 5003, 3001)?
- [ ] Volumes được backup trước scaling/migration?

---

## 📖 Documentation

| File | Nội Dung |
|------|---------|
| `Markdown/DOCKER_COMPOSE_NOTES.md` | ⚠️ **LÀM TRƯỚC** - Lưu ý chi tiết |
| `Markdown/DOCKER_BEST_PRACTICES.md` | Giải thích từng best practice |
| `docker-compose.yml` | Production config |
| `docker-compose.dev.yml` | Development (hot reload) |
| `.env.example` | Template environment variables |

---

## 🎯 Next Steps

1. ✅ Read `Markdown/DOCKER_COMPOSE_NOTES.md` (5 phút)
2. ✅ Fix PostgreSQL password & connection strings (2 phút)
3. ✅ Fix Next.js PostCSS error (5-10 phút)
4. ✅ Run `docker compose build` (5-15 phút)
5. ✅ Run `docker compose up -d` (1 phút)
6. ✅ Test: `docker compose ps` & `http://localhost:3001`

---

## 💡 Development Tips

```bash
# Hot reload development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Monitor real-time logs
docker compose logs -f frontend

# Execute tests inside container
docker compose exec admin-service dotnet test

# Database backup
docker compose exec postgres pg_dump -U postgres Host > backup.sql

# Database restore
docker compose exec -T postgres psql -U postgres Host < backup.sql
```

---

## 🆘 Need Help?

```bash
# 1. Check container status
docker compose ps

# 2. View detailed logs
docker compose logs postgres
docker compose logs admin-service

# 3. Test connectivity
docker compose exec frontend curl http://gateway:8080
docker compose exec admin-service curl http://postgres:5432

# 4. Inspect network
docker network inspect project_app-network

# 5. Check resource usage
docker stats
```

---

**Created:** 2025-03-05  
**Last Updated:** 2025-03-05  
**Version:** 1.0
