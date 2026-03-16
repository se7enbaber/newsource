using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Services;
using Microsoft.EntityFrameworkCore;
using ShareService.Services.Base;

namespace AdministrationService.Extensions
{
    public static class MigrationExtensions
    {
        public static async Task ApplyMigrationsAsync(this IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var services = scope.ServiceProvider;

            try
            {
                var context = services.GetRequiredService<ApplicationDbContext>();
                var logger = services.GetRequiredService<ILogger<Program>>();

                // 2. Tự động Migration cho Host Database
                var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                if (pendingMigrations.Any())
                {
                    logger.LogInformation("--> [HOST] Phát hiện {Count} bản cập nhật mới. Đang tiến hành Update Database...", pendingMigrations.Count());
                    await context.Database.MigrateAsync();
                    logger.LogInformation("--> [HOST] Update Database thành công.");
                }
                else
                {
                    logger.LogInformation("--> [HOST] Database đã ở phiên bản mới nhất.");
                }
                
                // 3. Tự động Migration cho toàn bộ Tenant có cơ sở dữ liệu riêng (isolated)
                logger.LogInformation("--> [TENANTS] Đang lấy danh sách Tenant...");
                List<Tenant> tenants;
                try 
                {
                    tenants = await context.Tenants
                        .IgnoreQueryFilters()
                        .Where(t => !string.IsNullOrEmpty(t.ConnectionString) && !t.IsDeleted)
                        .ToListAsync();
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "--> [TENANTS] Không thể lấy danh sách Tenant. Có thể bảng Tenants chưa tồn tại hoặc bị lỗi.");
                    return; 
                }

                if (tenants.Any())
                {
                    logger.LogInformation("--> [TENANTS] Phát hiện {Count} Tenant có DB riêng.", tenants.Count);
                    foreach (var tenant in tenants)
                    {
                        try
                        {
                            await MigrateTenantAsync(tenant, services);
                            logger.LogInformation("--> [OK] Migration hoàn tất cho Tenant: {Name}", tenant.Name);
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning("--> [FAIL] Lỗi khi migrate cho Tenant {Name}: {Message}", tenant.Name, ex.Message);
                        }
                    }
                }

                logger.LogInformation("--> Hệ thống Database đã sẵn sàng!");
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "Lỗi nghiêm trọng trong quá trình khởi tạo Database.");
                throw;
            }
        }

        private static async Task MigrateTenantAsync(Tenant tenant, IServiceProvider services)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            var provider = tenant.DbProvider?.ToLower() ?? "postgresql";

            switch (provider)
            {
                case "sqlserver":
                    optionsBuilder.UseSqlServer(tenant.ConnectionString);
                    break;
                case "mysql":
                    optionsBuilder.UseMySql(tenant.ConnectionString, ServerVersion.AutoDetect(tenant.ConnectionString));
                    break;
                case "postgresql":
                default:
                    optionsBuilder.UseNpgsql(tenant.ConnectionString);
                    break;
            }

            // Tạo DBContext tạm để chạy Migration cho Tenant
            using var tenantContext = new ApplicationDbContext(
                optionsBuilder.Options,
                services.GetRequiredService<ITenantService>(),
                services);

            // 1. Migrate Database cho Tenant
            var pending = await tenantContext.Database.GetPendingMigrationsAsync();
            if (pending.Any())
            {
                await tenantContext.Database.MigrateAsync();
            }

            // 2. Seed dữ liệu mặc định cho Tenant
            var seedService = services.GetRequiredService<ITenantDbSeedService>();
            await seedService.SeedTenantDataAsync(tenant, tenantContext);
        }
    }
}
