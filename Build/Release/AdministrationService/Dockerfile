FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble
WORKDIR /app
EXPOSE 10000
ENV PORT=10000 \
    ASPNETCORE_URLS=http://+:10000 \
    ASPNETCORE_ENVIRONMENT=Production
COPY . .
ENTRYPOINT ["dotnet", "AdministrationService.dll"]
