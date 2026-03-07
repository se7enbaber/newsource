FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble
WORKDIR /app
EXPOSE 5000 5001
ENV ASPNETCORE_URLS=http://+:5000
COPY . .
ENTRYPOINT ["dotnet", "Gateway.dll"]
