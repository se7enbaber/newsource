# 🚀 DOCKER DEPLOYMENT

## ⚙️ Configuration

### Environment Variables (.env)
All configuration is centralized in `.env` file:
```env
POSTGRES_DB=Host
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123456
POSTGRES_HOST_PORT=5443
ADMIN_HOST_PORT=7038
GATEWAY_HOST_PORT=5002
SIGNALR_HOST_PORT=10000
FRONTEND_HOST_PORT=3011

ADMIN_URL=http://localhost:7038
ADMIN_HANGFIRE=http://localhost:7038/hangfire
ADMIN_SWAGGER=http://localhost:7038/swagger
...
```

**To change configuration:**
1. Edit `.env` file
2. Run deploy script and select option [1] or [2]
3. All services will use new configuration

---

## ✅ Quick Start

### Windows
```bash
cd Deploy
.\deploy.bat
```

### Linux/Mac
```bash
cd Deploy
./deploy.sh
```

---

## 📋 Deployment Options (in deploy.bat/sh)

| Option | Description | Services |
|--------|-------------|----------|
| **[1] Complete** | Deploy all services | PostgreSQL + Admin + Gateway + SignalR + File + Frontend ✅ |
| **[2] Backend Only** | Backend services only | PostgreSQL + Admin + Gateway + SignalR + File |
| **[3] Build Only** | Build images (no start) | Interactive menu to build specific services or all |
| **[4] Stop Services** | Stop all (keep data) | Stops containers, preserves volumes |
| **[5] Stop & Remove** | Remove containers | Removes containers, keeps volumes/data |
| **[6] Full Cleanup** | ⚠️ Delete everything | Removes containers AND volumes (data loss!) |
| **[7] View Status** | Check services | Shows `docker compose ps` output |
| **[8] View Logs** | Real-time logs | Shows live logs from all services |
| **[0] Exit** | Exit menu | Close the script |

---

## 🌐 Services

| Service | URL | Configuration |
|---------|-----|---|
| **Frontend** | http://localhost:3011 | FRONTEND_URL, FRONTEND_HOST_PORT |
| **Admin API** | http://localhost:7038 | ADMIN_URL, ADMIN_HOST_PORT |
| **Admin - Hangfire** | http://localhost:7038/hangfire | ADMIN_HANGFIRE |
| **Admin - Swagger** | http://localhost:7038/swagger | ADMIN_SWAGGER |
| **Gateway** | http://localhost:5002 | GATEWAY_URL, GATEWAY_HOST_PORT |
| **SignalR** | http://localhost:10000 | SIGNALR_URL, SIGNALR_HOST_PORT |
| **PostgreSQL** | localhost:5443 | POSTGRES_HOST_PORT, POSTGRES_* |

---

## 🔗 Access Admin Service Endpoints

### After Deployment

**View all service URLs:**
```bash
cd Deploy
.\info.bat         # Windows
./info.sh          # Linux/Mac
```

### Admin Service Endpoints

**Hangfire (Background Jobs):**
```
http://localhost:7028/hangfire
```

**Swagger (API Documentation):**
```
http://localhost:7028/swagger
```

**Health Check:**
```
http://localhost:7028/health
```

---

## ⚙️ Customize Configuration

### Edit .env file
```bash
# Change any of these values:
POSTGRES_HOST_PORT=5443
ADMIN_HOST_PORT=7038
GATEWAY_HOST_PORT=5002
SIGNALR_HOST_PORT=10000
FRONTEND_HOST_PORT=3011
```

### Redeploy with new configuration
```bash
cd Deploy
.\deploy.bat        # Select [1] or [2]
```

All services automatically use `.env` values ✅

---

## 🔧 PostgreSQL Configuration

**Current (Fixed in .env):**
```
Database: Host
Username: postgres
Password: 123456
Port: 5443 (host) / 5432 (container)
Connection: Host=postgres;Port=5432;Database=Host;Username=postgres;Password=123456
```

**To change:**
1. Edit `.env`: `POSTGRES_PASSWORD=newpassword`
2. Redeploy: `.\deploy.bat` → select [1]
3. All .NET services automatically update ✅

---

## 🔄 Container Reuse (--no-recreate)

- Build images without recreating containers
- Preserves running state
- No data loss on rebuild
- Automatic in all scripts

```bash
cd Deploy
.\deploy.bat        # Just run and select [1] or [2]
```

---

## 💾 Directory Structure

```
Deploy/
├── deploy.bat         ⭐ Windows (Interactive menu)
├── deploy.sh          ⭐ Linux/Mac (Interactive menu)
├── info.bat           📋 Show all service URLs (Windows)
├── info.sh            📋 Show all service URLs (Linux/Mac)
└── README.md          (Deployment guide)

Root/
├── .env              ⚙️ Environment configuration (centralized)
├── DEPLOYMENT.md     (This file)
├── docker-compose.yml (Uses .env variables)
└── [services]
```

---

## 🎯 Common Tasks

### Deploy All Services
```bash
cd Deploy
.\deploy.bat
# Select [1]
```

### Deploy Backend Only
```bash
cd Deploy
.\deploy.bat
# Select [2]
```

### View All Service URLs
```bash
cd Deploy
.\info.bat          # Windows
./info.sh           # Linux/Mac
```

### Check Status
```bash
docker compose ps
```

### View Logs
```bash
docker compose logs -f
```

### View Admin Swagger Docs
```
http://localhost:7038/swagger
```

### View Hangfire Dashboard
```
http://localhost:7038/hangfire
```

### Database Backup
```bash
docker compose exec postgres pg_dump -U postgres Host > backup.sql
```

### Database Restore
```bash
docker compose exec -T postgres psql -U postgres Host < backup.sql
```

---

## 📚 More Information

- **Configuration:** `.env` file
- **Docker Compose:** `docker-compose.yml`
- **Services:** PostgreSQL, Admin API, Gateway, SignalR, File Service, Frontend

---

## ✨ Status

✅ All services configured via .env
✅ PostgreSQL: Host/123456 (Fixed)
✅ All endpoints accessible
✅ Container reuse enabled
✅ Production ready

---

**🚀 Ready to deploy!**

1. `cd Deploy`
2. Run `.\deploy.bat` (or `./deploy.sh`)
3. Select desired option
4. Access services via URLs in `.env`
