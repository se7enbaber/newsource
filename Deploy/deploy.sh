#!/bin/bash
cd "$(dirname "$0")"
# ╔══════════════════════════════════════════════════════════════════╗
# ║          DOCKER DEPLOYMENT MANAGER - SELECT OPTION              ║
# ║                PostgreSQL: Host/123456                           ║
# ║         Container Reuse: --no-recreate enabled                  ║
# ╚══════════════════════════════════════════════════════════════════╝

show_menu() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║               DOCKER DEPLOYMENT OPTIONS                         ║"
    echo "║                                                                  ║"
    echo "║         PostgreSQL: Host / 123456 (FIXED)                       ║"
    echo "║         Container Reuse: Enabled (no data loss)                 ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  [1] DEPLOY COMPLETE"
    echo "      └─ Deploys ALL 5 services (PostgreSQL, Admin, Gateway, SignalR, Frontend)"
    echo "      └─ Recommended for full production deployment"
    echo "      └─ Includes Next.js frontend (http://localhost:3001)"
    echo ""
    echo "  [2] DEPLOY BACKEND ONLY"
    echo "      └─ Deploys 4 backend services (PostgreSQL, Admin, Gateway, SignalR)"
    echo "      └─ Skips frontend (useful for backend-only debugging)"
    echo "      └─ Can add frontend later with option [1]"
    echo ""
    echo "  [3] BUILD IMAGES ONLY"
    echo "      └─ Only builds Docker images (does NOT start containers)"
    echo "      └─ Useful for CI/CD pipelines or pre-building images"
    echo "      └─ Run 'docker compose up -d' manually after"
    echo ""
    echo "  [4] STOP SERVICES"
    echo "      └─ Stops all running services"
    echo "      └─ Keeps containers and volumes (data preserved)"
    echo "      └─ Can restart later with option [1] or [2]"
    echo ""
    echo "  [5] STOP & REMOVE CONTAINERS"
    echo "      └─ Stops and removes all containers"
    echo "      └─ Keeps volumes and data"
    echo "      └─ Clean restart needed with option [1] or [2]"
    echo ""
    echo "  [6] FULL CLEANUP (⚠️ DATA LOSS!)"
    echo "      └─ Stops containers, removes containers AND volumes"
    echo "      └─ ⚠️ WARNING: PostgreSQL data will be DELETED"
    echo "      └─ Only use if you want complete reset"
    echo ""
    echo "  [7] VIEW STATUS"
    echo "      └─ Shows status of all running containers"
    echo "      └─ Shows ports and health checks"
    echo ""
    echo "  [8] VIEW LOGS"
    echo "      └─ Shows real-time logs from all services"
    echo "      └─ Press Ctrl+C to stop viewing logs"
    echo ""
    echo "  [0] EXIT"
    echo ""
    echo "──────────────────────────────────────────────────────────────────"
    echo ""
}

deploy_complete() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    DEPLOYING ALL SERVICES                        ║"
    echo "║                                                                  ║"
    echo "║  PostgreSQL + Admin API + Gateway + SignalR + Frontend          ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""

    echo "[1/4] Building images..."
    docker compose -f ../docker-compose.yml build || { echo "Build failed!"; read; return 1; }

    echo ""
    echo "[2/4] Stopping services..."
    docker compose -f ../docker-compose.yml stop

    echo ""
    echo "[3/4] Starting services (keeping existing containers)..."
    docker compose -f ../docker-compose.yml up --no-recreate -d || { echo "Start failed!"; read; return 1; }

    echo ""
    echo "[4/4] Verifying services..."
    sleep 3
    docker compose -f ../docker-compose.yml ps

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                  ✅ DEPLOYMENT COMPLETED                         ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Services URLs:"
    echo "    • Frontend:   http://localhost:3001"
    echo "    • Admin API:  http://localhost:7028"
    echo "    • Gateway:    http://localhost:5002"
    echo "    • SignalR:    http://localhost:5003"
    echo "    • Database:   localhost:5433 (postgres / 123456 / Host)"
    echo ""
    echo "  View logs:  docker compose -f ../docker-compose.yml logs -f"
    echo ""
    read -p "Press Enter to continue..."
}

deploy_backend() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                  DEPLOYING BACKEND ONLY                          ║"
    echo "║                                                                  ║"
    echo "║      PostgreSQL + Admin API + Gateway + SignalR                 ║"
    echo "║      (Frontend skipped - useful for debugging)                   ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""

    echo "[1/4] Building backend images..."
    docker compose -f ../docker-compose.yml build postgres admin-service gateway signalr file-service || { echo "Build failed!"; read; return 1; }

    echo ""
    echo "[2/4] Stopping services..."
    docker compose -f ../docker-compose.yml stop

    echo ""
    echo "[3/4] Starting backend services (keeping existing containers)..."
    docker compose -f ../docker-compose.yml up --no-recreate -d postgres admin-service gateway signalr file-service || { echo "Start failed!"; read; return 1; }

    echo ""
    echo "[4/4] Verifying services..."
    sleep 3
    docker compose -f ../docker-compose.yml ps

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                  ✅ DEPLOYMENT COMPLETED                         ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Backend Services URLs:"
    echo "    • Admin API:  http://localhost:7028"
    echo "    • Gateway:    http://localhost:5002"
    echo "    • SignalR:    http://localhost:5003"
    echo "    • Database:   localhost:5433 (postgres / 123456 / Host)"
    echo ""
    echo "  Frontend not deployed. To add frontend later, select option [1]."
    echo ""
    read -p "Press Enter to continue..."
}

build_only() {
    ./build.sh
}

stop_services() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    STOPPING SERVICES                             ║"
    echo "║                                                                  ║"
    echo "║     Containers and volumes will be PRESERVED                    ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""

    echo "Stopping all services..."
    docker compose -f ../docker-compose.yml stop

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                 ✅ SERVICES STOPPED                              ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  All data preserved. To restart, select option [1] or [2]."
    echo ""
    read -p "Press Enter to continue..."
}

stop_remove() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║              STOPPING & REMOVING CONTAINERS                      ║"
    echo "║                                                                  ║"
    echo "║     Containers removed but volumes/data PRESERVED               ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""

    echo "Removing containers..."
    docker compose -f ../docker-compose.yml down

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║            ✅ CONTAINERS REMOVED                                 ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Data in volumes preserved. To restart, select option [1] or [2]."
    echo ""
    read -p "Press Enter to continue..."
}

full_cleanup() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                   ⚠️  FULL CLEANUP ⚠️                            ║"
    echo "║                                                                  ║"
    echo "║  This will DELETE everything including PostgreSQL data!        ║"
    echo "║  There is NO UNDO - all data will be LOST!                      ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    read -p "Are you SURE? Type 'yes' to confirm: " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo ""
        echo "Cleanup cancelled."
        sleep 2
        return
    fi

    echo ""
    echo "⚠️  DELETING ALL CONTAINERS AND VOLUMES..."
    docker compose -f ../docker-compose.yml down -v

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║           ✅ FULL CLEANUP COMPLETED                              ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Everything removed. To start fresh, select option [1] or [2]."
    echo ""
    read -p "Press Enter to continue..."
}

view_status() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    SERVICE STATUS                                ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    docker compose ps

    echo ""
    read -p "Press Enter to continue..."
}

view_logs() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    VIEWING LOGS                                  ║"
    echo "║                                                                  ║"
    echo "║     Press Ctrl+C to stop viewing logs                           ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    docker compose -f ../docker-compose.yml logs -f
}

# Main loop
while true; do
    show_menu
    read -p "Select option [0-8]: " choice

    case $choice in
        1) deploy_complete ;;
        2) deploy_backend ;;
        3) build_only ;;
        4) stop_services ;;
        5) stop_remove ;;
        6) full_cleanup ;;
        7) view_status ;;
        8) view_logs ;;
        0) clear; echo "Goodbye!"; echo ""; exit 0 ;;
        *) echo "Invalid option. Please select 0-8."; sleep 2 ;;
    esac
done
