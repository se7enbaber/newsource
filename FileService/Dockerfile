# Bước 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy ShareService DLL trước (dependency)
COPY commondll/ /commondll/

# Copy và build FileService
COPY FileService/ .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Bước 2: Runtime image nhẹ hơn
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "FileService.dll"]
