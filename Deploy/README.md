# 🚀 DEPLOYMENT SCRIPTS

## ⭐ Quick Start

### Windows
```bash
.\deploy-complete.bat
```

### Linux/Mac
```bash
./deploy-complete.sh
```

---

## 📋 Available Scripts

### Complete Deployment (All Services)
- **Windows:** `deploy-complete.bat`
- **Linux/Mac:** `deploy-complete.sh`
- **Includes:** PostgreSQL, Admin API, Gateway, SignalR, Frontend

### Backend Only (No Frontend)
- **Windows:** `deploy-no-frontend.bat`
- **Linux/Mac:** `deploy-no-frontend.sh`
- **Includes:** PostgreSQL, Admin API, Gateway, SignalR

### Original Scripts
- **Windows:** `deploy.bat`
- **Linux/Mac:** `deploy.sh`

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README_DEPLOY.txt` | 5-minute overview |
| `DEPLOYMENT_COMPLETE.md` | Complete details |
| `DEPLOY_SUMMARY.md` | What's been done |
| `QUICK_DEPLOY.md` | Quick reference |

---

## 🌐 Services After Deployment

| Service | URL | Database |
|---------|-----|----------|
| Frontend | http://localhost:3001 | - |
| Admin API | http://localhost:7028 | PostgreSQL: Host |
| Gateway | http://localhost:5002 | - |
| SignalR | http://localhost:5003 | - |
| PostgreSQL | localhost:5433 | User: postgres, Pass: 123456 |

---

## 🔄 Container Reuse Feature

All scripts use `--no-recreate` flag:
- Rebuilds images WITHOUT recreating containers
- Preserves running state
- No data loss on rebuild
- ✅ Automatic in all scripts

---

## 📊 Verify Deployment

```bash
# Check all services
docker compose ps

# View logs
docker compose logs -f

# Test Frontend
curl http://localhost:3001
```

---

## ⚡ Quick Commands

```bash
# Stop services
docker compose stop

# Start services (keep containers)
docker compose up --no-recreate -d

# View logs
docker compose logs -f

# Database backup
docker compose exec postgres pg_dump -U postgres Host > backup.sql

# Database restore
docker compose exec -T postgres psql -U postgres Host < backup.sql
```

---

**PostgreSQL Config (Fixed):**
- Database: Host
- Username: postgres
- Password: 123456

**Status:** ✅ Ready for deployment
