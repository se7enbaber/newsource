using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using OpenIddict.EntityFrameworkCore.Models;
using OpenIddict.Abstractions;

namespace AdministrationService.Services
{
    public interface ITenantDbSeedService
    {
        Task SeedTenantDataAsync(Tenant tenant, ApplicationDbContext context);
    }

    public class TenantDbSeedService(IPasswordHasher<ApplicationUser> passwordHasher) : ITenantDbSeedService
    {
        public async Task SeedTenantDataAsync(Tenant tenant, ApplicationDbContext context)
        {
            // 0. Seed OIDC client "swagger" (để có thể gọi token API từ swagger)
            var existingApp = await context.Set<OpenIddictEntityFrameworkCoreApplication>()
                .AnyAsync(a => a.ClientId == "swagger");

            if (!existingApp)
            {
                var descriptor = new OpenIddictApplicationDescriptor
                {
                    ClientId = "swagger",
                    Permissions =
                    {
                        OpenIddictConstants.Permissions.Endpoints.Token,
                        OpenIddictConstants.Permissions.GrantTypes.Password
                    }
                };

                // Chèn trực tiếp (Manual Insert) vì không có Manager dễ dùng ở đây
                context.Set<OpenIddictEntityFrameworkCoreApplication>().Add(new OpenIddictEntityFrameworkCoreApplication
                {
                    Id = Guid.NewGuid().ToString(),
                    ClientId = descriptor.ClientId,
                    Permissions = "[Permissions:endpoints:token][Permissions:grant_types:password]" 
                    // Lưu ý: Đây là cách insert thủ công hơi "táy máy" lách qua Manager của OpenIddict.
                    // Nếu dùng Manager.CreateAsync thì chuẩn hơn nhưng đòi hỏi setup DI Scope phức tạp hơn.
                });
                await context.SaveChangesAsync();
            }

            // 1. Seed Role Admin
            var adminRole = await context.Roles.IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.NormalizedName == "ADMIN" && r.TenantId == tenant.Id);

            if (adminRole == null)
            {
                adminRole = new ApplicationRole
                {
                    Id = Guid.NewGuid(),
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    TenantId = tenant.Id,
                    IsSystemRole = true,
                    IsActive = true
                };
                context.Roles.Add(adminRole);
                await context.SaveChangesAsync();
            }

            // 2. Seed Permissions cho Role Admin
            var allPermissions = Permissions.GetAll();
            var currentClaims = await context.RoleClaims
                .Where(rc => rc.RoleId == adminRole.Id && rc.ClaimType == "Permission")
                .ToListAsync();
            
            var existingPerms = currentClaims.Select(c => c.ClaimValue).ToHashSet();

            foreach (var claim in currentClaims.Where(c => c.ClaimValue != null && !allPermissions.Contains(c.ClaimValue)))
            {
                context.RoleClaims.Remove(claim);
            }

            foreach (var perm in allPermissions.Where(p => !existingPerms.Contains(p)))
            {
                context.RoleClaims.Add(new IdentityRoleClaim<Guid>
                {
                    RoleId = adminRole.Id,
                    ClaimType = "Permission",
                    ClaimValue = perm
                });
            }
            await context.SaveChangesAsync();

            // 3. Seed User Admin
            var adminUser = await context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.NormalizedUserName == "ADMIN" && u.TenantId == tenant.Id);

            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = "admin",
                    NormalizedUserName = "ADMIN",
                    FullName = "Tenant Administrator",
                    Email = $"admin@{tenant.Code.ToLower()}.com",
                    NormalizedEmail = $"ADMIN@{tenant.Code.ToUpper()}.COM",
                    TenantId = tenant.Id,
                    EmailConfirmed = true,
                    IsActive = true,
                    SecurityStamp = Guid.NewGuid().ToString()
                };
                adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "Password123!");
                context.Users.Add(adminUser);
                await context.SaveChangesAsync();
            }

            // 4. Gán Role cho User
            var roleAssigned = await context.UserRoles
                .AnyAsync(ur => ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id);

            if (!roleAssigned)
            {
                context.UserRoles.Add(new IdentityUserRole<Guid>
                {
                    UserId = adminUser.Id,
                    RoleId = adminRole.Id
                });
                await context.SaveChangesAsync();
            }
        }
    }
}
