# Bước 1: Build stage (.NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Sao chép các file dự án để restore (tối ưu hóa lớp cache của Docker)
COPY ["AdministrationService/AdministrationService.csproj", "AdministrationService/"]
COPY ["ShareService/ShareService.csproj", "ShareService/"]

# Restore cho project chính
RUN dotnet restore "AdministrationService/AdministrationService.csproj"

# Sao chép toàn bộ source code (vì context là thư mục gốc nên ta lấy cả project)
COPY . .

# Chuyển vào thư mục của project chính và build
WORKDIR "/src/AdministrationService"
RUN dotnet build "AdministrationService.csproj" -c Release -o /app/build

# Publish ứng dụng
FROM build AS publish
WORKDIR "/src/AdministrationService"
RUN dotnet publish "AdministrationService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Bước 2: Final stage (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 10000

# Cài đặt các thư viện hệ thống cần thiết (Fix lỗi libgssapi_krb5.so.2) và curl cho health check
RUN apt-get update && apt-get install -y libgssapi-krb5-2 curl && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

ENV PORT=10000 \
    ASPNETCORE_URLS=http://+:10000 \
    ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "AdministrationService.dll"]
