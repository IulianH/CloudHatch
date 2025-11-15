# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Auth/Auth.Web/Auth.Web.csproj", "Auth/Auth.Web/"]
COPY ["Auth/Auth.App/Auth.App.csproj", "Auth/Auth.App/"]
COPY ["Auth/Users.App/Users.App.csproj", "Auth/Users.App/"]
COPY ["Auth/Users.Domain/Users.Domain.csproj", "Auth/Users.Domain/"]
COPY ["Auth/Auth.Infra/Auth.Infra.csproj", "Auth/Auth.Infra/"]
COPY ["Auth/Users.Infra/Users.Infra.csproj", "Auth/Users.Infra/"]
RUN dotnet restore "./Auth/Auth.Web/Auth.Web.csproj"
COPY . .
WORKDIR "/src/Auth/Auth.Web"
RUN dotnet build "./Auth.Web.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Auth.Web.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Auth.Web.dll"]