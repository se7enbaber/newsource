## Docker Best Practices Applied

### Dockerfile Optimizations

1. **Multi-Stage Builds**
   - Separated build, publish, and runtime stages for all .NET services
   - Significantly reduces final image size by excluding build tools
   - Only necessary dependencies in the runtime layer

2. **Layer Caching**
   - Project file (`.csproj`) copied before source code
   - `dotnet restore` runs on its own layer
   - Avoids re-downloading NuGet packages on source code changes
   - Node.js package.json copied before source code for npm

3. **Non-Root Users**
   - All services run as non-root users for security
   - Users created in build stage with specific UIDs (1000, 1001)
   - Proper file ownership with `chown` for Next.js

4. **Health Checks**
   - Added HEALTHCHECK instructions to all services
   - 30s interval, 10s timeout, 5s start period, 3 retries
   - Enables Docker to monitor and restart unhealthy containers

5. **Minimal Base Images**
   - Node.js uses `alpine` for smaller footprint (~45MB vs 600MB)
   - .NET uses official images optimized for production
   - PostgreSQL uses `16-alpine` for smaller size

### Docker Compose Enhancements

1. **Resource Limits**
   - CPU and memory limits set for each service
   - Prevents runaway processes from consuming all resources
   - Reservations ensure minimum guaranteed resources

2. **Named Volumes**
   - PostgreSQL data uses named volume `postgres-data` for persistence
   - Independent of container lifecycle

3. **Health Dependencies**
   - PostgreSQL has explicit healthcheck configuration
   - Other services wait for PostgreSQL to be healthy before starting
   - Prevents connection errors during startup

4. **Environment Configuration**
   - Centralized environment variables for production settings
   - ASPNETCORE_ENVIRONMENT set consistently across services
   - Next.js API URLs properly configured for container networking

5. **Networking**
   - All services on custom bridge network `app-network`
   - Services reference each other by container name
   - Improves isolation and DNS resolution

### .dockerignore Files

- Excludes development files, node_modules, build artifacts
- Reduces build context size
- Speeds up build process
- Prevents sensitive files from entering images

### Security Best Practices

1. **Non-Root Execution**
   - Services run with limited privileges
   - Reduced attack surface if container is compromised

2. **Environment Variables**
   - Sensitive data managed via environment variables
   - Can be passed via `-e` flag or `.env` files
   - Not hardcoded in images

3. **Minimal Attack Surface**
   - Alpine Linux images reduce vulnerability surface
   - Only necessary packages installed
   - Development dependencies removed from production builds

### Development Workflow

Use `docker-compose.dev.yml` for development:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This provides:
- Volume mounts for hot reload
- `develop: watch:` configuration for automatic rebuilds
- Development environment variables
- Debugging capabilities

### Production Deployment

For production, use the base `docker-compose.yml`:
```bash
docker compose up -d
```

Includes:
- Resource limits and reservations
- Restart policies
- Health checks
- Production environment settings

### Building Images

Build all services:
```bash
docker compose build
```

Build specific service:
```bash
docker compose build admin-service
```

With no cache:
```bash
docker compose build --no-cache
```

### Useful Commands

Monitor running containers:
```bash
docker compose ps
docker compose logs -f
docker compose logs frontend
```

Execute commands in running containers:
```bash
docker compose exec admin-service dotnet --version
docker compose exec frontend npm list
```

Clean up resources:
```bash
docker compose down                    # Stop and remove containers
docker compose down -v                 # Also remove volumes
docker system prune                    # Remove unused images/networks
```

### Environment Variables

For production overrides, create `.env` file:
```
POSTGRES_PASSWORD=your-secure-password
ASPNETCORE_ENVIRONMENT=Production
NODE_ENV=production
```

Access via:
```bash
docker compose --env-file .env.production up -d
```
