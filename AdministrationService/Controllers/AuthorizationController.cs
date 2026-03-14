using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using ShareService.Services.Base;
using System.Security.Claims;
using System.Text.Json;

public class AuthorizationController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly IDistributedCache _cache;

    public AuthorizationController(
        ApplicationDbContext context,
        IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    [HttpPost("~/connect/token"), Consumes("application/x-www-form-urlencoded"), Produces("application/json")]
    public async Task<IActionResult> Exchange()
    {
        var request = HttpContext.GetOpenIddictServerRequest() ?? throw new InvalidOperationException("OIDC request null");

        if (request.IsPasswordGrantType())
        {
            var tenantCode = request["tenant"]?.ToString()?.Trim();
            if (string.IsNullOrEmpty(tenantCode))
                return BadRequest("Thiếu thông tin Tenant.");

            // Uppercase trước khi vào DB → cho phép PostgreSQL dùng index trên cột NormalizedCode thay vì scan full table
            var tenantCodeUpper = tenantCode.ToUpperInvariant();
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t =>
                t.Code.ToUpper() == tenantCodeUpper ||
                t.Name.ToUpper() == tenantCodeUpper);

            if (tenant == null)
                return BadRequest("Tenant không tồn tại.");
            // --- BẮT ĐẦU: LẤY DB CONTEXT CỦA TENANT ---
            // Định danh tenantId để QueryFilter không bị Null
            var tenantService = HttpContext.RequestServices.GetRequiredService<ITenantService>();
            tenantService.TenantId = tenant.Id;

            // Tạo scope mới để DI cấp phát một UserManager và ApplicationDbContext riêng cho quá trình login này
            using var scope = HttpContext.RequestServices.CreateScope();
            var scopedUserManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var scopedSignInManager = scope.ServiceProvider.GetRequiredService<SignInManager<ApplicationUser>>();
            var scopedContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // ÉP KIỂU KẾT NỐI: Sử dụng thẳng DB của Tenant
            if (!string.IsNullOrEmpty(tenant.ConnectionString))
            {
                var connectionString = tenant.ConnectionString;
                // Patch localhost if running in Docker container
                if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
                {
                    if (connectionString.Contains("localhost") || connectionString.Contains("127.0.0.1"))
                    {
                        connectionString = connectionString.Replace("localhost", "postgres").Replace("127.0.0.1", "postgres");
                    }
                }
                scopedContext.Database.SetConnectionString(connectionString);
            }
            // --- KẾT THÚC ---

            var userName = request.Username?.ToUpperInvariant() ?? string.Empty;

            var user = await scopedUserManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.NormalizedUserName == userName && u.TenantId == tenant.Id);

            if (user == null || !(await scopedSignInManager.CheckPasswordSignInAsync(user, request.Password!, true)).Succeeded)
                return BadRequest("Sai tài khoản hoặc mật khẩu.");

            var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                OpenIddictConstants.Claims.Name, OpenIddictConstants.Claims.Role);

            identity.AddClaim(OpenIddictConstants.Claims.Subject, user.Id.ToString());
            identity.AddClaim(OpenIddictConstants.Claims.Name, user.UserName ?? string.Empty);
            identity.AddClaim("tenant_id", user.TenantId.ToString());
            identity.AddClaim("tenant_name", tenant.Name);
            identity.AddClaim("tenant_code", tenant.Code);
            identity.AddClaim("tenant_logo", tenant.LogoUrl ?? string.Empty);

            if (!string.IsNullOrEmpty(tenant.ConnectionString))
            {
                identity.AddClaim("tenant_conn", tenant.ConnectionString);
                identity.AddClaim("tenant_provider", tenant.DbProvider ?? "postgresql");
            }

            // 1. Query Roles & TenantFeatures song song để giảm round-trip DB
            var rolesTask = (from ur in scopedContext.Set<IdentityUserRole<Guid>>()
                             join r in scopedContext.Roles.IgnoreQueryFilters() on ur.RoleId equals r.Id
                             where ur.UserId == user.Id && r.TenantId == tenant.Id
                             select r.Name).ToListAsync();

            var tenantFeaturesTask = _context.TenantFeatures
                .Where(tf => tf.TenantId == tenant.Id)
                .Select(tf => tf.FeatureCode)
                .ToListAsync();

            await Task.WhenAll(rolesTask, tenantFeaturesTask);

            var roles = rolesTask.Result;
            var tenantFeatures = tenantFeaturesTask.Result;

            // Add Roles vào JWT
            var userPermissions = new HashSet<string>();
            var isAdmin = false;

            foreach (var roleName in roles)
            {
                if (string.IsNullOrEmpty(roleName)) continue;

                var roleClaim = new Claim(OpenIddictConstants.Claims.Role, roleName);
                roleClaim.SetDestinations(OpenIddictConstants.Destinations.AccessToken);
                identity.AddClaim(roleClaim);

                // Đặc cách cho ADMIN: không cần nạp quyền vào JWT để giảm bloat
                if (roleName.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                {
                    isAdmin = true;
                    continue;
                }

                // Lấy quyền từ Cache hoặc DB (cache hit = không tốn thêm DB round-trip)
                var cacheKey = $"permissions_{tenant.Id}_{roleName}";
                var cachedPermissions = await _cache.GetStringAsync(cacheKey);
                List<string>? rolePermissions = null;

                if (!string.IsNullOrEmpty(cachedPermissions))
                {
                    rolePermissions = JsonSerializer.Deserialize<List<string>>(cachedPermissions);
                }
                else
                {
                    rolePermissions = await (from r in scopedContext.Roles.IgnoreQueryFilters()
                                             join rc in scopedContext.RoleClaims on r.Id equals rc.RoleId
                                             where r.TenantId == tenant.Id
                                                && r.NormalizedName == roleName.ToUpperInvariant()
                                                && rc.ClaimType == "Permission"
                                             select rc.ClaimValue).ToListAsync();

                    var cacheOptions = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(rolePermissions), cacheOptions);
                }

                if (rolePermissions != null)
                {
                    foreach (var p in rolePermissions)
                        if (!string.IsNullOrEmpty(p)) userPermissions.Add(p);
                }
            }

            // Chỉ ghi Permission vào token nếu không phải Admin (Admin handler xử lý riêng)
            if (!isAdmin)
            {
                foreach (var p in userPermissions)
                {
                    var claim = new Claim("Permission", p);
                    claim.SetDestinations(OpenIddictConstants.Destinations.AccessToken);
                    identity.AddClaim(claim);
                }
            }

            // 2. Add Tenant Features vào JWT
            foreach (var f in tenantFeatures)
            {
                var claim = new Claim("Feature", f);
                claim.SetDestinations(OpenIddictConstants.Destinations.AccessToken);
                identity.AddClaim(claim);
            }

            identity.SetDestinations(c => [OpenIddictConstants.Destinations.AccessToken]);
            return SignIn(new ClaimsPrincipal(identity), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }
        return BadRequest("Grant type not supported");
    }

    /// <summary>
    /// Đăng xuất — thu hồi access token hiện tại.
    /// Client gửi: POST /connect/logout
    /// Header: Authorization: Bearer {access_token}
    /// </summary>
    [Authorize(AuthenticationSchemes = OpenIddictServerAspNetCoreDefaults.AuthenticationScheme)]
    [HttpPost("~/connect/logout")]
    public IActionResult Logout()
    {
        // OpenIddict sẽ tự động revoke token khi SignOut với scheme của nó
        return SignOut(
            authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
            properties: new AuthenticationProperties
            {
                RedirectUri = "/"
            });
    }
}
