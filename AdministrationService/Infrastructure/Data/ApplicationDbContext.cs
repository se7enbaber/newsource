using ShareService.Services.Base;
using ShareService.Infrastructure.Model.Base;
using AdministrationService.Extensions;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Providers;
using AdministrationService.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.EntityFrameworkCore.Models;

namespace AdministrationService.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ITenantService _tenantService;
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, 
            ITenantService tenantService, 
            IServiceProvider serviceProvider)
            : base(options)
        {
            _tenantService = tenantService;
            _serviceProvider = serviceProvider;
        }
        public DbSet<Tenant> Tenants => Set<Tenant>();
        public DbSet<TenantFeature> TenantFeatures => Set<TenantFeature>();
        public DbSet<JobLog> JobLogs => Set<JobLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.UseOpenIddict(); // Quan tr?ng: Tích h?p các b?ng OIDC

            // Ð?i tên các b?ng Identity
            modelBuilder.Entity<ApplicationUser>().ToTable($"{AppConstants.PrefixTable}Users");
            modelBuilder.Entity<ApplicationRole>().ToTable($"{AppConstants.PrefixTable}Roles");
            modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable($"{AppConstants.PrefixTable}UserRoles");
            modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable($"{AppConstants.PrefixTable}UserClaims");
            modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable($"{AppConstants.PrefixTable}Userlogins");
            modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable($"{AppConstants.PrefixTable}UserTokens");
            modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable($"{AppConstants.PrefixTable}RoleClaims");

            // Ð?i tên b?ng Tenant
            modelBuilder.Entity<Tenant>().ToTable($"{AppConstants.PrefixTable}Tenants");

            // Ð?i tên các b?ng OpenIddict (N?u dùng b?n EF chu?n)
            modelBuilder.Entity<OpenIddictEntityFrameworkCoreApplication>().ToTable($"{AppConstants.PrefixTable}OidcApplications");
            modelBuilder.Entity<OpenIddictEntityFrameworkCoreAuthorization>().ToTable($"{AppConstants.PrefixTable}OidcAuthorizations");
            modelBuilder.Entity<OpenIddictEntityFrameworkCoreScope>().ToTable($"{AppConstants.PrefixTable}OidcScopes");
            modelBuilder.Entity<OpenIddictEntityFrameworkCoreToken>().ToTable($"{AppConstants.PrefixTable}OidcTokens");

            // T? Ð?NG L?C: B?t k? khi nào query b?ng User, nó s? t? d?ng thêm TenantId
            modelBuilder.Entity<ApplicationUser>().HasQueryFilter(u => u.TenantId == _tenantService.TenantId && !u.IsDeleted);
            modelBuilder.Entity<ApplicationRole>().HasQueryFilter(u => u.TenantId == _tenantService.TenantId && !u.IsDeleted);
            modelBuilder.Entity<Tenant>().HasQueryFilter(t => !t.IsDeleted);

            // C?u hình b?ng TenantFeatures
            modelBuilder.Entity<TenantFeature>()
                .ToTable($"{AppConstants.PrefixTable}TenantFeatures")
                .HasKey(tf => new { tf.TenantId, tf.FeatureCode });

            modelBuilder.Entity<JobLog>().ToTable($"{AppConstants.PrefixTable}JobLogs");
            
            modelBuilder.Entity<TenantFeature>()
                .HasOne(tf => tf.Tenant)
                .WithMany()
                .HasForeignKey(tf => tf.TenantId);

            modelBuilder.Entity<Tenant>().HasIndex(t => t.Code).IsUnique();

            // Override ch? m?c c?a Role d? h? tr? Multi-Tenant (M?i Tenant 1 m?ng role Name riêng)
            modelBuilder.Entity<ApplicationRole>().Metadata.RemoveIndex(new[] { modelBuilder.Entity<ApplicationRole>().Metadata.FindProperty("NormalizedName")! });
            modelBuilder.Entity<ApplicationRole>().HasIndex(r => new { r.NormalizedName, r.TenantId }).HasDatabaseName("RoleNameIndex").IsUnique();

            // Override ch? m?c c?a User d? h? tr? Multi-Tenant
            modelBuilder.Entity<ApplicationUser>().Metadata.RemoveIndex(new[] { modelBuilder.Entity<ApplicationUser>().Metadata.FindProperty("NormalizedUserName")! });
            modelBuilder.Entity<ApplicationUser>().HasIndex(u => new { u.NormalizedUserName, u.TenantId }).HasDatabaseName("UserNameIndex").IsUnique();
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Tránh l?i Circular Dependency b?ng cách dùng Scope l?y ServiceProvider th? công
            using var scope = _serviceProvider.CreateScope();
            var tenantProvider = scope.ServiceProvider.GetService<ITenantProvider>();

            if (tenantProvider != null)
            {
                var connString = tenantProvider.GetConnectionString();
                var provider = tenantProvider.GetDbProvider();

                Console.WriteLine($"[DEBUG-ONCONFIGURING] connString retrieved: {connString}");

                // N?u Tenant có ConnectionString riêng, ép EF dùng DB dó thay vì DB m?c d?nh
                if (!string.IsNullOrEmpty(connString))
                {
                    Console.WriteLine($"[DEBUG-ONCONFIGURING] OVERRIDING EF CORE OPTIONS: {connString}");
                    switch (provider?.ToLower())
                    {
                        case "sqlserver":
                            optionsBuilder.UseSqlServer(connString);
                            break;
                        case "mysql":
                            optionsBuilder.UseMySql(connString, ServerVersion.AutoDetect(connString));
                            break;
                        case "postgresql":
                        default:
                            optionsBuilder.UseNpgsql(connString);
                            break;
                    }
                }
            }
            base.OnConfiguring(optionsBuilder);
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // 1. L?y thông tin User và Tenant t? HttpContext (Token)
            var httpContextAccessor = _serviceProvider?.GetService<IHttpContextAccessor>();
            var userClaims = httpContextAccessor?.HttpContext?.User;

            // L?y UserId (Guid)
            Guid? currentUserId = null;
            var userIdClaim = userClaims?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out Guid parsedUserId))
                currentUserId = parsedUserId;

            // L?y UserName (string)
            var currentUserName = userClaims?.Identity?.Name ?? "System";

            // L?y TenantId t? Claim
            Guid? currentTenantId = null;
            var tenantIdClaim = userClaims?.FindFirst("tenant_id")?.Value;
            if (Guid.TryParse(tenantIdClaim, out Guid parsedTenantId))
                currentTenantId = parsedTenantId;

            // FAKE SESSION DÀNH CHO BACKGROUND JOB HO?C H? TH?NG
            // N?u Context hi?n t?i không có Token (ch?y ng?m), th? l?y t? ITenantService
            if (!currentTenantId.HasValue && _tenantService != null && _tenantService.TenantId != Guid.Empty)
            {
                currentTenantId = _tenantService.TenantId;
            }

            var entries = ChangeTracker.Entries();

            foreach (var entry in entries)
            {
                // A. X? LÝ IAuditEntity (CreatedAt, CreatedBy, CreatedId, UpdatedAt...)
                if (entry.Entity is IAuditEntity auditEntity)
                {
                    if (entry.State == EntityState.Added)
                    {
                        auditEntity.CreatedAt = DateTime.UtcNow;
                        auditEntity.CreatedBy = currentUserName;
                        auditEntity.CreatedId = currentUserId;
                    }
                    else if (entry.State == EntityState.Modified)
                    {
                        auditEntity.UpdatedAt = DateTime.UtcNow;
                        auditEntity.UpdatedBy = currentUserName;
                        auditEntity.UpdatedId = currentUserId;
                    }
                }

                // B. X? LÝ IAuditDeleteEntity (Soft Delete)
                if (entry.Entity is IAuditDeleteEntity deleteEntity && entry.State == EntityState.Deleted)
                {
                    // Chuy?n tr?ng thái t? Deleted sang Modified d? không m?t d? li?u th?t
                    entry.State = EntityState.Modified;

                    deleteEntity.IsDeleted = true;
                    deleteEntity.DeletedAt = DateTime.UtcNow;
                    deleteEntity.DeletedBy = currentUserName;
                    deleteEntity.DeletedId = currentUserId;
                }

                // C. X? LÝ IMultiTenant (T? d?ng gán TenantId khi t?o m?i)
                if (entry.Entity is IMultiTenant tenantEntity && entry.State == EntityState.Added)
                {
                    // Ch? gán n?u TenantId chua có giá tr? (tru?ng h?p Admin t?o h? Tenant khác thì có th? truy?n vào th? công)
                    if (tenantEntity.TenantId == Guid.Empty && currentTenantId.HasValue)
                    {
                        tenantEntity.TenantId = currentTenantId.Value;
                    }
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}

