using AdministrationService.Authorization;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Infrastructure.Model.DTOs;
using AdministrationService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdministrationService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TenantsController(ITenantAppService tenantAppService) : ControllerBase
    {
        [HttpGet]
        [HasPermission(Permissions.Tenants.View)]
        public async Task<ActionResult<PagedResult<TenantDto>>> GetPaged([FromQuery] PaginationParams @params)
        {
            var (items, total) = await tenantAppService.GetPagedAsync(@params.PageNumber, @params.PageSize);
            return Ok(new PagedResult<TenantDto>
            {
                Items = items,
                TotalCount = total,
                PageNumber = @params.PageNumber,
                PageSize = @params.PageSize
            });
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.Tenants.View)]
        public async Task<ActionResult<TenantDto>> GetById(Guid id)
        {
            var tenant = await tenantAppService.GetByIdAsync(id);
            if (tenant == null) return NotFound();
            return Ok(tenant);
        }

        [HttpPost]
        [HasPermission(Permissions.Tenants.Create)]
        public async Task<IActionResult> Create([FromBody] CreateTenantDto dto)
        {
            try
            {
                var result = await tenantAppService.CreateAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [HasPermission(Permissions.Tenants.Edit)]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateTenantDto dto)
        {
            var success = await tenantAppService.UpdateAsync(id, dto);
            if (!success) return BadRequest("Cập nhật Tenant thất bại.");
            return Ok(new { message = "Cập nhật thành công" });
        }

        [HttpDelete("{id}")]
        [HasPermission(Permissions.Tenants.Delete)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await tenantAppService.DeleteAsync(id);
            if (!success) return BadRequest("Không thể xóa Tenant.");
            return Ok(new { message = "Xóa thành công" });
        }

        [HttpPost("{id}/migrate")]
        [HasPermission(Permissions.Tenants.Edit)]
        public async Task<IActionResult> Migrate(Guid id)
        {
            var result = await tenantAppService.MigrateAsync(id);
            if (!result) return BadRequest("Chạy Migration thất bại. Kiểm tra lại Connection String.");
            return Ok(new { message = "Chạy Migration thành công." });
        }

        /// <summary>
        /// Lấy danh sách tất cả Features có trong hệ thống để UI hiển thị Checkbox
        /// </summary>
        [HttpGet("get_features")]
        [HasPermission(Permissions.Tenants.View)]
        public ActionResult<List<string>> GetAllFeatures()
        {
            var features = Features.GetAll();
            return Ok(features);
        }

        [HttpPost("check-connection")]
        [HasPermission(Permissions.Tenants.Create)]
        public async Task<IActionResult> CheckConnection([FromBody] CheckConnectionRequest request)
        {
            var (success, message) = await tenantAppService.CheckConnectionAsync(request.ConnectionString, request.Provider);
            return Ok(new { success, message });
        }
    }

    public class CheckConnectionRequest
    {
        public string ConnectionString { get; set; } = default!;
        public string Provider { get; set; } = default!;
    }
}
