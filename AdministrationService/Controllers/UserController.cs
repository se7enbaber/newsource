using AdministrationService.Infrastructure.Model;
using AdministrationService.Infrastructure.Model.DTOs;
using AdministrationService.Services.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AdministrationService.Authorization;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Yêu cầu JWT để lấy tenant_id từ claims
[RequiredFeature(Features.Administration.Users)]
public class UsersController(IUserService userService) : ControllerBase
{
    /// <summary>
    /// Lấy danh sách user phân trang cho Ant Design Grid
    /// </summary>
    [HttpGet]
    [HasPermission(Permissions.Users.View)]
    public async Task<ActionResult<PagedResult<UserDto>>> GetPaged([FromQuery] PaginationParams @params)
    {
        var result = await userService.GetPagedUsersAsync(@params);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết một User
    /// </summary>
    [HttpGet("{id}")]
    [HasPermission(Permissions.Users.View)]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await userService.GetByIdAsync(id);
        if (user == null) return NotFound("Không tìm thấy người dùng hoặc bạn không có quyền.");
        return Ok(user);
    }

    /// <summary>
    /// Tạo mới User (Bao gồm gán TenantId tự động)
    /// </summary>
    [HttpPost]
    [HasPermission(Permissions.Users.Create)]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        try
        {
            var result = await userService.CreateAsync(dto);

            return Ok(new { message = "Tạo người dùng thành công" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thông tin User và Roles
    /// </summary>
    [HttpPut("{id}")]
    [HasPermission(Permissions.Users.Edit)]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateUserDto dto)
    {
        try
        {
            var success = await userService.UpdateAsync(id, dto);
            if (!success) return NotFound(new { message = "Không tìm thấy user hoặc cập nhật thất bại." });

            return Ok(new { message = "Cập nhật thành công" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    /// <summary>
    /// Reset mật khẩu (Dành cho Admin)
    /// </summary>
    [HttpPost("{id}/reset-password")]
    [HasPermission(Permissions.Users.Edit)]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] string newPassword)
    {
        var result = await userService.ResetPasswordAsync(id, newPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { message = "Đổi mật khẩu thành công" });
    }

    /// <summary>
    /// Xóa User
    /// </summary>
    [HttpDelete("{id}")]
    [HasPermission(Permissions.Users.Delete)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await userService.DeleteAsync(id);
        if (!success) return NotFound("Không tìm thấy người dùng để xóa.");

        return Ok(new { message = "Xóa người dùng thành công" });
    }
}