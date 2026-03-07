#!/bin/bash
# Display all service URLs and endpoints after deployment

clear
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║                  DEPLOYED SERVICES & ENDPOINTS                   ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Source .env file (from parent directory)
if [ -f "../.env" ]; then
    source ../.env
else
    echo "ERROR: .env file not found!"
    exit 1
fi

echo "  🌐 SERVICE URLs:"
echo ""
echo "    • Admin Service:   $ADMIN_URL"
echo "    • Gateway:         $GATEWAY_URL"
echo "    • SignalR:         $SIGNALR_URL"
echo "    • Frontend:        $FRONTEND_URL"

echo ""
echo "  🔗 ADMIN SERVICE ENDPOINTS:"
echo ""
echo "    • Hangfire:        $ADMIN_HANGFIRE"
echo "    • Swagger:         $ADMIN_SWAGGER"
echo "    • Health Check:    $ADMIN_HEALTH"

echo ""
echo "  💾 DATABASE:"
echo ""
echo "    • Connection:      localhost:$POSTGRES_HOST_PORT"
echo "    • User:            $POSTGRES_USER"
echo "    • Password:        $POSTGRES_PASSWORD"
echo "    • Database:        $POSTGRES_DB"

echo ""
echo "  📊 VERIFY DEPLOYMENT:"
echo ""
echo "    docker compose ps         (Check all services)"
echo "    docker compose logs -f    (View real-time logs)"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  ✅ All services configured and running!"
echo ""
