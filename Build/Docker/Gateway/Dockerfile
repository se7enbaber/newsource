# Bước 1: Build stage (.NET 8)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
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
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
EXPOSE 8080
COPY --from=publish /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Gateway.dll"]
