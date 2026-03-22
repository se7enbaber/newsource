# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
RUN apk add --no-cache clang build-base zlib-dev musl-dev

WORKDIR /src

# Copy project files for restore (ShareService is a ProjectReference)
COPY ["FileService/FileService.csproj", "FileService/"]
COPY ["ShareService/ShareService.csproj", "ShareService/"]

RUN dotnet restore "FileService/FileService.csproj" -r linux-musl-x64

# Copy all source and publish
COPY . .
WORKDIR "/src/FileService"

RUN dotnet publish "FileService.csproj" \
    -c Release \
    -r linux-musl-x64 \
    --no-restore \
    -o /app \
    /p:PublishAot=true \
    /p:StripSymbols=true

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0-alpine
WORKDIR /app

RUN apk add --no-cache curl

# Copy binary
COPY --from=build /app/FileService .

USER guest
EXPOSE 8080
ENV PORT=8080 \
    ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["./FileService"]
