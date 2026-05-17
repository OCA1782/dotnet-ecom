FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/Ecom.Domain/Ecom.Domain.csproj src/Ecom.Domain/
COPY src/Ecom.Application/Ecom.Application.csproj src/Ecom.Application/
COPY src/Ecom.Infrastructure/Ecom.Infrastructure.csproj src/Ecom.Infrastructure/
COPY src/Ecom.API/Ecom.API.csproj src/Ecom.API/
RUN dotnet restore src/Ecom.API/Ecom.API.csproj

COPY . .
RUN dotnet publish src/Ecom.API/Ecom.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "Ecom.API.dll"]
