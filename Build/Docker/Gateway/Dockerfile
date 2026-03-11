# Bước 1: Build stage (.NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Cấu trúc project nằm sâu trong GatewayService/Gateway
COPY ["GatewayService/Gateway/Gateway.csproj", "GatewayService/Gateway/"]
COPY ["ShareService/ShareService.csproj", "ShareService/"]
RUN dotnet restore "GatewayService/Gateway/Gateway.csproj"

# Sao chép toàn bộ source code
COPY . .

WORKDIR "/src/GatewayService/Gateway"
RUN dotnet build "Gateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Bước 2: Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
EXPOSE 10000
COPY --from=publish /app/publish .

ENV PORT=10000 \
    ASPNETCORE_URLS=http://+:10000 \
    ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Gateway.dll"]
