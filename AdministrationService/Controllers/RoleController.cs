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
    [Authorize] // Bảo mật theo Tenant
    [RequiredFeature(Features.Administration.Roles)]
    public class RolesController(IRoleService roleService) : ControllerBase
    {
        [HttpGet]
        [HasPermission(Permissions.Roles.View)]
        public async Task<ActionResult<PagedResult<RoleDto>>> GetPaged([FromQuery] PaginationParams @params)
        {
            // Dùng hàm có sẵn hỗ trợ Search và Pagination
            var result = await roleService.GetPagedRolesAsync(@params);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.Roles.View)]
        public async Task<ActionResult<RoleDto>> GetById(Guid id)
        {
            var role = await roleService.GetByIdAsync(id);
            if (role == null) return NotFound();
            return Ok(role);
        }
        [HttpGet("get_role_dropdown")]
        [HasPermission(Permissions.Roles.View)]
        public async Task<ActionResult<RoleDto>> GetRolesForDropdownAsync()
        {
            var role = await roleService.GetRolesForDropdownAsync();
            if (role == null) return NotFound();
            return Ok(role);
        }

        [HttpGet("get_permissions")]
        [HasPermission(Permissions.Roles.View)]
        public ActionResult<List<string>> GetAllPermissions()
        {
            var permissions = Permissions.GetAll();
            return Ok(permissions);
        }
        [HttpPost]
        [HasPermission(Permissions.Roles.Create)]
        public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
        {
            var result = await roleService.CreateAsync(dto);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [HasPermission(Permissions.Roles.Edit)]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateRoleDto dto)
        {
            var success = await roleService.UpdateAsync(id, dto);
            if (!success) return BadRequest("Cập nhật Role thất bại.");
            return Ok(new { message = "Cập nhật thành công" });
        }

        [HttpDelete("{id}")]
        [HasPermission(Permissions.Roles.Delete)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await roleService.DeleteAsync(id);
            if (!success) return BadRequest("Không thể xóa Role (có thể đang có User sử dụng).");
            return Ok(new { message = "Xóa thành công" });
        }
    }
}