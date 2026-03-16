namespace AdministrationService.Extensions
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            // Repositories
            services.AddScoped<Repositories.Tenants.ITenantRepository, Repositories.Tenants.TenantRepository>();
            services.AddScoped<Repositories.Roles.IRoleRepository, Repositories.Roles.RoleRepository>();
            services.AddScoped<Repositories.Users.IUserRepository, Repositories.Users.UserRepository>();
            services.AddScoped<Repositories.Jobs.IJobLogRepository, Repositories.Jobs.JobLogRepository>();

            // Services
            services.AddScoped<ShareService.Services.Base.ITenantService, Services.TenantService>();
            services.AddScoped<Services.IRoleService, Services.RoleService>();
            services.AddScoped<Services.Users.IUserService, Services.Users.UserService>();
            services.AddScoped<Services.ITenantAppService, Services.TenantAppService>();
            services.AddScoped<Services.Notifications.ISignalRNotificationService, Services.Notifications.SignalRNotificationService>();

            services.AddScoped<Services.ITenantDbSeedService, Services.TenantDbSeedService>();
            
            // Jobs
            services.AddScoped<Services.Jobs.JobCleanupService>();
            services.AddScoped<Services.ITenantMigrationJob, Services.TenantMigrationJob>();

            return services;
        }
    }
}
