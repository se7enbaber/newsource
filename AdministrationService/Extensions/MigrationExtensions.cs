using ShareService.Services.Base;
using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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

                var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                if (pendingMigrations.Any())
                {
                    logger.LogInformation("--> Phát hiện {Count} bản cập nhật mới. Đang tiến hành Update Database...", pendingMigrations.Count());

                    // Chỉ chạy những bản cập nhật còn thiếu (Tương đương lệnh 'dotnet ef database update')
                    await context.Database.MigrateAsync();

                    logger.LogInformation("--> Update Database thành công.");
                }
                else
                {
                    logger.LogInformation("--> Database đã ở phiên bản mới nhất. Không có thay đổi nào được áp dụng.");
                }

                // 3. Tự động Migration cho toàn bộ Tenant có cơ sở dữ liệu riêng (isolated)
                var tenants = await context.Tenants
                    .IgnoreQueryFilters()
                    .Where(t => !string.IsNullOrEmpty(t.ConnectionString) && !t.IsDeleted)
                    .ToListAsync();

                if (tenants.Any())
                {
                    logger.LogInformation("--> Phát hiện {Count} Tenant có DB riêng. Đang tự động kiểm tra Migration...", tenants.Count);
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
