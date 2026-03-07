# Bước 1: Build stage (.NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["SignalRService/SignalRService.csproj", "SignalRService/"]
COPY ["ShareService/ShareService.csproj", "ShareService/"]
RUN dotnet restore "SignalRService/SignalRService.csproj"

COPY . .

WORKDIR "/src/SignalRService"
RUN dotnet build "SignalRService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SignalRService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Bước 2: Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
EXPOSE 8080
COPY --from=publish /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "SignalRService.dll"]
