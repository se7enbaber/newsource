FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble
WORKDIR /app
EXPOSE 8080 8443
ENV ASPNETCORE_URLS=http://+:8080
COPY . .
ENTRYPOINT ["dotnet", "AdministrationService.dll"]
