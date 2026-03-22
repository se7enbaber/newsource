# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
RUN apk add --no-cache clang build-base zlib-dev musl-dev

WORKDIR /src

# Copy project files and restore
COPY ["SignalRService/SignalRService.csproj", "SignalRService/"]
COPY ["ShareService/ShareService.csproj", "ShareService/"]
RUN dotnet restore "SignalRService/SignalRService.csproj" -r linux-musl-x64

# Copy source and publish
COPY . .
WORKDIR "/src/SignalRService"

RUN dotnet publish "SignalRService.csproj" \
    -c Release \
    -o /app \
    --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
WORKDIR /app

RUN apk add --no-cache curl

# Copy binary
COPY --from=build /app .

USER guest
EXPOSE 8080
ENV PORT=8080 \
    ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "SignalRService.dll"]
