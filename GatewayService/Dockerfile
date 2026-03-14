# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Copy project files for restore
COPY ["GatewayService/Gateway/Gateway.csproj", "GatewayService/Gateway/"]
COPY ["ShareService/ShareService.csproj", "ShareService/"]
RUN dotnet restore "GatewayService/Gateway/Gateway.csproj"

# Copy all source
COPY . .
WORKDIR "/src/GatewayService/Gateway"

# Publish (Non-AOT)
RUN dotnet publish "Gateway.csproj" \
    -c Release \
    -o /app \
    --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=build /app .

USER guest
EXPOSE 8080
ENV PORT=8080 \
    ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Gateway.dll"]
