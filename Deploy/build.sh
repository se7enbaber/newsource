#!/bin/bash
cd "$(dirname "$0")"

show_menu() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                  DOCKER BUILD SELECTOR                           ║"
    echo "║                                                                  ║"
    echo "║  Select which services you want to build Docker images for.      ║"
    echo "║  Containers will NOT be started.                                 ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  [1] Build ALL Services (Full System)"
    echo "  [2] Build Admin Service"
    echo "  [3] Build File Service"
    echo "  [4] Build SignalR Service"
    echo "  [5] Build Gateway"
    echo "  [6] Build Frontend (Next.js)"
    echo "  [7] Build Backend Only (Admin + File + SignalR + Gateway)"
    echo ""
    echo "  [0] EXIT"
    echo ""
    echo "──────────────────────────────────────────────────────────────────"
    echo ""
}

build_service() {
    local service_name=$1
    local display_name=$2
    clear
    echo ""
    echo "🚀 Building $display_name image..."
    if [ -z "$service_name" ]; then
        docker compose -f ../docker-compose.yml build
    else
        docker compose -f ../docker-compose.yml build $service_name
    fi
    local status=$?
    
    echo ""
    if [ $status -eq 0 ]; then
        echo "╔══════════════════════════════════════════════════════════════════╗"
        echo "║                 ✅ BUILD COMPLETED SUCCESSFULLY                  ║"
        echo "╚══════════════════════════════════════════════════════════════════╝"
        echo ""
        echo "  To start services, run: docker compose -f ../docker-compose.yml up -d"
    else
        echo "╔══════════════════════════════════════════════════════════════════╗"
        echo "║                   ❌ BUILD FAILED                                ║"
        echo "║              Check errors above for details                      ║"
        echo "╚══════════════════════════════════════════════════════════════════╝"
    fi
    echo ""
    read -p "Press Enter to continue..."
}

while true; do
    show_menu
    read -p "Select option [0-7]: " choice

    case $choice in
        1) build_service "" "ALL Services" ;;
        2) build_service "admin-service" "Admin Service" ;;
        3) build_service "file-service" "File Service" ;;
        4) build_service "signalr" "SignalR Service" ;;
        5) build_service "gateway" "Gateway" ;;
        6) build_service "frontend" "Frontend" ;;
        7) build_service "admin-service file-service signalr gateway" "ALL Backend" ;;
        0) exit 0 ;;
        *) echo "Invalid option. Please select 0-7."; sleep 2 ;;
    esac
done
