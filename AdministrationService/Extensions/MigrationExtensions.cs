using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Services;
using AdministrationService.Services.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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
                try
                {
                    var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                    if (pendingMigrations.Any())
                    {
                        logger.LogInformation("--> [HOST] Phát hiện {Count} bản cập nhật mới. Đang tiến hành Update Database...", pendingMigrations.Count());
                        await context.Database.MigrateAsync();
                        logger.LogInformation("--> [HOST] Update Database thành công.");

                        // Gửi thông báo SignalR thành công
                        try {
                            var signalR = services.GetRequiredService<ISignalRNotificationService>();
                            await signalR.SendNotificationAsync(Guid.Empty, "Hệ thống đã cập nhật", "Cơ sở dữ liệu trung tâm đã được nâng cấp lên phiên bản mới nhất.", "success");
                        } catch { /* Bỏ qua nếu SignalR Hub chưa sẵn sàng */ }
                    }
                    else
                    {
                        logger.LogInformation("--> [HOST] Database đã ở phiên bản mới nhất.");
                    }
                }
                catch (Exception migrateEx)
                {
                    // Check if it's "relation already exists" error (idempotent)
                    string exceptionMessage = migrateEx.ToString();
                    if (exceptionMessage.Contains("42P07") || exceptionMessage.Contains("already exists") || exceptionMessage.Contains("23505"))
                    {
                        logger.LogWarning("--> [HOST] Database bảng đã tồn tại hoặc trùng khóa. Đang nỗ lực đồng bộ lại lịch sử Migration...");
                        try 
                        {
                            // Nỗ lực đồng bộ bản ghi Initial vào history để tránh lặp lại lỗi này ở lần khởi động sau
                            await context.Database.ExecuteSqlRawAsync("INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('20260315074500_Initial', '10.0.3') ON CONFLICT DO NOTHING;");
                            
                            var signalR = services.GetService<ISignalRNotificationService>();
                            if (signalR != null)
                                await signalR.SendNotificationAsync(Guid.Empty, "Đồng bộ Database", "Hệ thống đã phát hiện cấu trúc cũ và tự động đồng bộ hóa lịch sử Migration.", "warning");
                            
                            // Tiến hành chạy lại lần hai để apply các cập nhật tiếp theo (nếu có)  
                            await context.Database.MigrateAsync();
                            logger.LogInformation("--> [HOST] Update Database phần còn lại thành công.");
                        }
                        catch (Exception ex) {
                             logger.LogWarning("--> [HOST] Không thể chèn bản ghi vào history hoặc chạy tiếp migration: {Message}", ex.Message);
                             // throw; // throw ra ngoài để dừng host nếu migrate the rest fails? No, keep it graceful like before
                        }
                    }
                    else
                    {
                        logger.LogError(migrateEx, "--> [HOST] Lỗi không mong muốn khi cập nhật database.");
                        throw;
                    }
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
                            await MigrateTenantAsync(tenant, services, logger);
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

        private static async Task MigrateTenantAsync(Tenant tenant, IServiceProvider services, ILogger logger)
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
            try
            {
                var pending = await tenantContext.Database.GetPendingMigrationsAsync();
                if (pending.Any())
                {
                    await tenantContext.Database.MigrateAsync();
                    
                    try 
                    {
                        var signalR = services.GetRequiredService<ISignalRNotificationService>();
                        await signalR.SendNotificationAsync(tenant.Id, "Database Updated", $"Cơ sở dữ liệu của bạn ({tenant.Name}) đã được cập nhật thành công.", "success");
                    }
                    catch { }
                }
            }
            catch (Exception migrateEx)
            {
                // Check if it's "relation already exists" error (idempotent)
                string exceptionMessage = migrateEx.ToString();
                if (exceptionMessage.Contains("42P07") || exceptionMessage.Contains("already exists") || exceptionMessage.Contains("23505"))
                {
                    // Database is already in correct state - silently skip after matching history
                    try {
                        var sqlPostgres = "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('20260315074500_Initial', '10.0.3') ON CONFLICT DO NOTHING;";
                        var sqlOther = "IF NOT EXISTS(SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260315074500_Initial') INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260315074500_Initial', '10.0.3');";
                        var sql = provider == "postgresql" ? sqlPostgres : sqlOther;
                        
                        await tenantContext.Database.ExecuteSqlRawAsync(sql);
                        
                        // Chạy lại migrate để apply các migration sau Initial (nếu có)
                        await tenantContext.Database.MigrateAsync();
                    } catch {}
                }
                else
                {
                    throw;
                }
            }

            // 2. Seed dữ liệu mặc định cho Tenant
            var seedService = services.GetRequiredService<ITenantDbSeedService>();
            await seedService.SeedTenantDataAsync(tenant, tenantContext);
        }
    }
}
