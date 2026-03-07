# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore dependencies (optimized for layer caching)
COPY ["SignalRService/SignalRService.csproj", "SignalRService/"]
RUN dotnet restore "SignalRService/SignalRService.csproj"

# Copy source and build
COPY . .
WORKDIR /src/SignalRService
RUN dotnet build "SignalRService.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "SignalRService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN groupadd -r dotnetapp && useradd -r -g dotnetapp dotnetapp

COPY --from=publish /app/publish .
RUN chown -R dotnetapp:dotnetapp /app

USER dotnetapp
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "SignalRService.dll"]
