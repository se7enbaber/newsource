using AdministrationService.Authorization;
using AdministrationService.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using System.Linq;
using System.Security.Claims;

namespace AdministrationService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PermissionsController(ApplicationDbContext dbContext) : ControllerBase
    {
        /// <summary>
        /// Lấy tất cả các Quyền hạn đang có trong hệ thống (định nghĩa trong Permissions constants)
        /// </summary>
        [HttpGet("all")]
        public IActionResult GetAllPermissions()
        {
            var permissions = Permissions.GetAll();
            return Ok(permissions);
        }

        /// <summary>
        /// Lấy danh sách Quyền hạn của người dùng đang đăng nhập
        /// </summary>
        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            // 1. Lấy User ID từ claim sub
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst(OpenIddictConstants.Claims.Subject)?.Value;

            if (!Guid.TryParse(userId, out var userGuid)) return Ok(new List<string>());

            // 2. Lấy Tenant ID từ Token
            var tenantIdString = User.FindFirst("tenant_id")?.Value;
            if (!Guid.TryParse(tenantIdString, out var tenantId)) return Ok(new List<string>());

            // 3. Kiểm tra xem User có Role Admin không
            var isAdmin = await (from ur in dbContext.UserRoles
                                 join r in dbContext.Roles.IgnoreQueryFilters() on ur.RoleId equals r.Id
                                 where ur.UserId == userGuid 
                                    && r.TenantId == tenantId 
                                    && r.NormalizedName == "ADMIN"
                                 select 1).AnyAsync();

            if (isAdmin)
            {
                return Ok(Permissions.GetAll());
            }

            // 4. Nếu không phải Admin, truy vấn các Permission có trong các Role của User
            var permissions = await (from ur in dbContext.UserRoles
                                     join r in dbContext.Roles.IgnoreQueryFilters() on ur.RoleId equals r.Id
                                     join rc in dbContext.RoleClaims on r.Id equals rc.RoleId
                                     where ur.UserId == userGuid
                                        && r.TenantId == tenantId
                                        && rc.ClaimType == "Permission" 
                                     select rc.ClaimValue).Distinct().ToListAsync();

            return Ok(permissions);
        }
    }
}
