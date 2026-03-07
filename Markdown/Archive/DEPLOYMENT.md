# 🚀 Deployment Guide

## PostgreSQL Configuration (Fixed)
- **Database:** Host
- **Username:** postgres
- **Password:** 123456
- **Port:** 5433

Connection string (trong .NET services):
```
Host=postgres;Port=5432;Database=Host;Username=postgres;Password=123456
```

---

## ⚠️ Important: Keep Existing Containers When Building

**Problem:** Mỗi lần build lại, Docker Compose mặc định tạo container mới thay vì giữ lại cái cũ.

**Solution:** Dùng flag `--no-recreate` để giữ lại container cũ, chỉ update image.

---

## 📋 Deployment Methods

### Option 1: **Automatic Deployment Script** (Recommended)

#### Windows:
```bash
.\deploy.bat
```

#### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

**Script sẽ tự động:**
1. Build tất cả images
2. Stop services (giữ lại containers)
3. Start services với `--no-recreate`
4. Verify status
5. Hiển thị URLs và logs

---

### Option 2: **Manual Commands**

#### Build images:
```bash
docker compose build
```

#### Stop services (giữ lại containers):
```bash
docker compose stop
```

#### Start services với --no-recreate (không tạo container mới):
```bash
docker compose up --no-recreate -d
```

#### Kiểm tra status:
```bash
docker compose ps
```

#### Xem logs:
```bash
docker compose logs -f
```

---

### Option 3: **One-liner Deployment**
```bash
docker compose build && docker compose stop && docker compose up --no-recreate -d && docker compose ps
```

---

## 🔄 Build Lại Without Recreating Containers

Nếu chỉ muốn rebuild images mà không touch containers:

```bash
# Build không dùng cache (nếu cần)
docker compose build --no-cache

# Sau đó start lại
docker compose up --no-recreate -d
```

---

## 🔍 Verify Deployment

### Check container status:
```bash
docker compose ps
```

**Expected output:**
```
NAME                    COMMAND                  SERVICE       STATUS              PORTS
erp-postgres           docker-entrypoint.s...   postgres      Up 2 minutes        0.0.0.0:5433->5432/tcp
erp-admin-api          dotnet AdminministrationService.dll    admin-service    Up 1 minute   0.0.0.0:7028->8080/tcp
erp-gateway            dotnet Gateway.dll       gateway       Up 1 minute        0.0.0.0:5002->8080/tcp
erp-signalr            dotnet SignalRService.dll    signalr   Up 1 minute        0.0.0.0:5003->8080/tcp
erp-frontend           npm start                frontend      Up 1 minute        0.0.0.0:3001->3000/tcp
```

### Check logs:
```bash
docker compose logs -f
```

### Test connectivity:
```bash
# Test Admin API
curl http://localhost:7028

# Test Gateway
curl http://localhost:5002

# Test Frontend
curl http://localhost:3001

# Test PostgreSQL
docker compose exec postgres psql -U postgres -d Host -c "SELECT version();"
```

---

## 📊 Services URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3001 | Next.js UI |
| Admin API | http://localhost:7028 | .NET Admin Service |
| Gateway | http://localhost:5002 | API Gateway |
| SignalR | http://localhost:5003 | Real-time notifications |
| PostgreSQL | localhost:5433 | Database (user: postgres, pass: 123456) |

---

## 🛑 Stop Services

### Stop services (keep containers):
```bash
docker compose stop
```

### Stop và xóa containers:
```bash
docker compose down
```

### Stop, xóa containers VÀ volumes (⚠️ MẤT DỮ LIỆU!):
```bash
docker compose down -v
```

---

## 🔄 Update Only One Service

Nếu chỉ update một service (ví dụ: admin-service):

```bash
# Build từng service
docker compose build admin-service

# Restart service mà không tạo container mới
docker compose up --no-recreate -d admin-service
```

---

## 💾 Database Backup/Restore

### Backup database:
```bash
docker compose exec postgres pg_dump -U postgres Host > backup.sql
```

### Restore database:
```bash
docker compose exec -T postgres psql -U postgres Host < backup.sql
```

---

## 🚀 Full Deployment Workflow

```bash
# 1. Prepare: Fix Dockerfiles, update code
#    ...

# 2. Deploy using script
./deploy.sh                    # Linux/Mac
# or
.\deploy.bat                   # Windows

# 3. Verify
docker compose ps
docker compose logs -f

# 4. Test
curl http://localhost:3001
curl http://localhost:7028
curl http://localhost:5002
```

---

## ❌ Troubleshooting

### Container stuck in "starting" state:
```bash
docker compose logs postgres
docker compose logs admin-service
```

### Port already allocated:
```bash
# Find process using port
netstat -ano | findstr :5433  # Windows
lsof -i :5433                  # Linux/Mac

# Change port in docker-compose.yml if needed
```

### Container exiting unexpectedly:
```bash
# Check logs
docker compose logs frontend

# Rebuild without cache
docker compose build --no-cache frontend

# Restart
docker compose up --no-recreate -d
```

### Need to reset everything:
```bash
# Remove all containers and volumes
docker compose down -v

# Full redeploy
./deploy.sh    # or deploy.bat
```

---

## 📝 Environment Variables

All services use fixed credentials. To change in future:

Edit `docker-compose.yml`:
```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: "your-new-password"

admin-service:
  environment:
    ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=Host;Username=postgres;Password=your-new-password"
```

Then redeploy:
```bash
./deploy.sh
```

---

**Last Updated:** 2025-03-05
