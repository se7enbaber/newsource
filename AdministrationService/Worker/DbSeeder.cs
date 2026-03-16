using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using System.Security.Claims;

public class DbSeeder(IServiceScopeFactory scopeFactory, IConfiguration configuration) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // 1. Tạo DB và chạy Migration TRUỚC KHI resolve các service khác có thể truy vấn DB
        await context.Database.MigrateAsync(ct);

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var manager = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();

        // 2. Tạo OpenIddict client "swagger" (nếu chưa có)
        if (await manager.FindByClientIdAsync("swagger", ct) == null)
        {
            await manager.CreateAsync(new OpenIddictApplicationDescriptor
            {
                ClientId = "swagger",
                Permissions =
                {
                    OpenIddictConstants.Permissions.Endpoints.Token,
                    OpenIddictConstants.Permissions.GrantTypes.Password
                }
            }, ct);
        }

        // 3. Tạo Tenant (nếu chưa có)
        var tenant = await context.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Code == "Admin", ct);

        if (tenant == null)
        {
            tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = "System Admin",
                Code = "Admin",
                DbProvider = configuration["TenantSettings:DefaultProvider"] ?? "postgresql",
                ConnectionString = configuration.GetConnectionString("DefaultConnection"),
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "SystemSeed"
            };
            context.Tenants.Add(tenant);
            await context.SaveChangesAsync(ct);
        }

        // 4. Tạo Role Admin (nếu chưa có)
        var adminRole = await context.Roles.IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.NormalizedName == "ADMIN" && r.TenantId == tenant.Id, ct);

        if (adminRole == null)
        {
            adminRole = new ApplicationRole
            {
                Id = Guid.NewGuid(),
                Name = "Admin",
                NormalizedName = "ADMIN",
                TenantId = tenant.Id
            };
            var roleResult = await roleManager.CreateAsync(adminRole);
            if (!roleResult.Succeeded)
                throw new Exception("Tạo Role thất bại: " + string.Join(", ", roleResult.Errors.Select(e => e.Description)));
        }

        // 5. Đồng bộ Permissions vào RoleClaims cho Admin Role
        var allPermissions = AdministrationService.Authorization.Permissions.GetAll();
        var currentClaims = await roleManager.GetClaimsAsync(adminRole);
        var existingPerms = currentClaims.Where(c => c.Type == "Permission").Select(c => c.Value).ToHashSet();

        // Xóa quyền cũ không còn tồn tại
        foreach (var claim in currentClaims.Where(c => c.Type == "Permission" && !allPermissions.Contains(c.Value)))
            await roleManager.RemoveClaimAsync(adminRole, claim);

        // Thêm quyền mới
        foreach (var perm in allPermissions.Where(p => !existingPerms.Contains(p)))
            await roleManager.AddClaimAsync(adminRole, new Claim("Permission", perm));

        // 6. Tạo User Admin (nếu chưa có)
        var adminUser = await userManager.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.NormalizedUserName == "ADMIN" && u.TenantId == tenant.Id, ct);

        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = "admin",
                NormalizedUserName = "ADMIN",
                FullName = "System Administrator",
                Email = "admin@system.com",
                NormalizedEmail = "ADMIN@SYSTEM.COM",
                TenantId = tenant.Id,
                EmailConfirmed = true,
                IsActive = true,
            };
            var createResult = await userManager.CreateAsync(adminUser, "Password123!");
            if (!createResult.Succeeded)
                throw new Exception("Tạo User thất bại: " + string.Join(", ", createResult.Errors.Select(e => e.Description)));
        }

        // 7. Gán Role Admin cho User (luôn kiểm tra, không chỉ khi tạo mới)
        var roleAssigned = await context.Set<IdentityUserRole<Guid>>()
            .AnyAsync(ur => ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id, ct);

        if (!roleAssigned)
        {
            context.Set<IdentityUserRole<Guid>>().Add(new IdentityUserRole<Guid>
            {
                UserId = adminUser.Id,
                RoleId = adminRole.Id
            });
            await context.SaveChangesAsync(ct);
        }

        // 8. Đồng bộ Features cho Host Tenant (Luôn gán toàn bộ Features mới nhất cho Host)
        var allFeatures = AdministrationService.Authorization.Features.GetAll();
        var currentFeatures = await context.TenantFeatures
            .Where(tf => tf.TenantId == tenant.Id)
            .Select(tf => tf.FeatureCode)
            .ToListAsync(ct);

        foreach (var feature in allFeatures)
        {
            if (!currentFeatures.Contains(feature))
            {
                context.TenantFeatures.Add(new TenantFeature
                {
                    TenantId = tenant.Id,
                    FeatureCode = feature
                });
            }
        }
        await context.SaveChangesAsync(ct);

        // 9. Lên lịch dọn dẹp JobLogs cũ (lưu tối đa 15 ngày)
        Hangfire.RecurringJob.AddOrUpdate<AdministrationService.Services.Jobs.JobCleanupService>(
            "Cleanup-JobLogs-Daily",
            service => service.CleanupOldLogsAsync(15),
            Hangfire.Cron.Daily());
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}