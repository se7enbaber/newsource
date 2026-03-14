# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["AdministrationService/AdministrationService.csproj", "AdministrationService/"]
COPY ["ShareService/ShareService.csproj", "ShareService/"]
RUN dotnet restore "AdministrationService/AdministrationService.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/AdministrationService"
RUN dotnet publish "AdministrationService.csproj" -c Release -o /app --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết (Fix lỗi libgssapi_krb5.so.2) và curl cho health check nội bộ
RUN apt-get update && apt-get install -y libgssapi-krb5-2 curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app .

# Cấu hình Port đồng bộ với Program.cs
ENV ASPNETCORE_URLS=http://+:8080
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "AdministrationService.dll"]
