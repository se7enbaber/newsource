.PHONY: help build up down logs clean

help:
	@echo "Available commands:"
	@echo "  make build           - Build all Docker images"
	@echo "  make up              - Start all containers"
	@echo "  make down            - Stop all containers"
	@echo "  make logs            - View logs from all containers"
	@echo "  make clean           - Remove containers, images, and volumes"
	@echo "  make build-admin     - Build AdministrationService only"
	@echo "  make build-gateway   - Build GatewayService only"
	@echo "  make build-frontend  - Build NextJS frontend only"

build:
	@echo "Building all images..."
	docker-compose build --no-cache

build-admin:
	@echo "Building AdministrationService..."
	docker build -t administration-service ./AdministrationService

build-gateway:
	@echo "Building GatewayService..."
	docker build -t gateway-service ./GatewayService

build-frontend:
	@echo "Building NextJS frontend..."
	docker build -t nextjs-frontend ./my-nextjs

up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo "Services started successfully!"
	@echo ""
	@echo "Access points:"
	@echo "  Gateway:        http://localhost:5000"
	@echo "  Administration: http://localhost:8080"
	@echo "  Frontend:       http://localhost:3000"
	@echo "  PostgreSQL:     localhost:5432"

down:
	@echo "Stopping all services..."
	docker-compose down

logs:
	@docker-compose logs -f

clean:
	@echo "Cleaning up..."
	docker-compose down -v
	docker system prune -f

ps:
	@docker-compose ps
