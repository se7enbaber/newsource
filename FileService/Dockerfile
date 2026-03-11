# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy ShareService DLL trước (dependency)
COPY commondll/ /commondll/

# Copy và build FileService
COPY FileService/ .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd -r dotnetapp && useradd -r -g dotnetapp dotnetapp

COPY --from=build /app/publish .
RUN chown -R dotnetapp:dotnetapp /app

USER dotnetapp
EXPOSE 10000

ENV PORT=10000 \
    ASPNETCORE_URLS=http://+:10000 \
    ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:10000/health/live || exit 1

ENTRYPOINT ["dotnet", "FileService.dll"]
