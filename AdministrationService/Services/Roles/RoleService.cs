using AdministrationService.Infrastructure.Model;
using AdministrationService.Infrastructure.Model.DTOs;
using AdministrationService.Repositories.Users;
using ShareService.Services.Base;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Linq.Expressions;

namespace AdministrationService.Services
{
    public interface IRoleService : IBaseService<ApplicationRole, RoleDto, CreateRoleDto>
    {
        Task<PagedResult<RoleDto>> GetPagedRolesAsync(PaginationParams @params);
        // L?y danh sách Role d? hi?n th? trong dropdown
        Task<List<RoleDto>> GetRolesForDropdownAsync(); 
    }

    public class RoleService(
        IRoleRepository repository,
        RoleManager<ApplicationRole> roleManager,
        ITenantService tenantService) : BaseService<ApplicationRole, RoleDto, CreateRoleDto>(repository, tenantService), IRoleService
    {
        // Hàm này dùng l?i logic phân trang c?a Base nhung thêm b? l?c Search
        public async Task<PagedResult<RoleDto>> GetPagedRolesAsync(PaginationParams @params)
        {
            // 1. T?o di?u ki?n l?c (Predicate)
            Expression<Func<ApplicationRole, bool>>? filter = null;
            if (!string.IsNullOrEmpty(@params.SearchTerm))
            {
                filter = r => r.Name!.Contains(@params.SearchTerm);
            }

            // 2. G?i hàm GetPagedAsync t? BaseRepository (n?u BaseRepo c?a b?n h? tr? predicate)
            // Ho?c s? d?ng logic phân trang có s?n
            var (items, total) = await _repository.GetPagedAsync(@params.PageNumber, @params.PageSize, filter);

            return new PagedResult<RoleDto>
            {
                Items = items.Select(MapToDto).ToList(),
                TotalCount = total,
                PageNumber = @params.PageNumber,
                PageSize = @params.PageSize
            };
        }

        // Map t? Entity sang DTO
        protected override RoleDto MapToDto(ApplicationRole entity)
        {
            var dto = new RoleDto
            {
                Id = entity.Id,
                Name = entity.Name ?? "",
                Description = entity.Description,
                IsActive = entity.IsActive,
                IsSystemRole = entity.IsSystemRole
            };

            // L?y danh sách Permission t? Role Claims
            // Luu ý: Trong th?c t?, b?n có th? th?c hi?n Join tr?c ti?p d? t?i uu performance khi l?y danh sách l?n
            var claims = roleManager.GetClaimsAsync(entity).GetAwaiter().GetResult();
            dto.Permissions = claims.Where(c => c.Type == "Permission").Select(c => c.Value).ToList();

            return dto;
        }

        // Map t? DTO sang Entity (Identity c?n Name và NormalizedName)
        protected override ApplicationRole MapToEntity(CreateRoleDto dto) => new()
        {
            Name = dto.Name,
            NormalizedName = dto.Name.ToUpper(),
            TenantId = _tenantService.TenantId,
            Description = dto.Description,
            IsActive = dto.IsActive,
            IsSystemRole = dto.IsSystemRole
        };

        // Override hàm Update vì Role c?n qua RoleManager
        public override async Task<bool> UpdateAsync(Guid id, CreateRoleDto dto)
        {
            var role = await roleManager.FindByIdAsync(id.ToString());
            if (role == null) return false;

            role.Name = dto.Name;
            role.NormalizedName = dto.Name.ToUpper();
            role.Description = dto.Description;
            role.IsActive = dto.IsActive;
            
            // Note: SystemRole thu?ng c?m g? SystemRole n?u nó dã là true, 
            // tuy nhiên tu? nghi?p v? có update c? c? này hay không
            role.IsSystemRole = dto.IsSystemRole;

            var result = await roleManager.UpdateAsync(role);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Không th? c?p nh?t Role: {errors}");
            }

            // X? lý Permissions (RoleClaims)
            var existingClaims = await roleManager.GetClaimsAsync(role);
            var permissionClaims = existingClaims.Where(c => c.Type == "Permission");

            foreach (var claim in permissionClaims)
            {
                await roleManager.RemoveClaimAsync(role, claim);
            }

            foreach (var permission in dto.Permissions)
            {
                await roleManager.AddClaimAsync(role, new System.Security.Claims.Claim("Permission", permission));
            }

            return result.Succeeded;
        }

        public override async Task<RoleDto> CreateAsync(CreateRoleDto dto)
        {
            var role = MapToEntity(dto);

            // S? d?ng RoleManager thay vì Repository thông thu?ng
            var result = await roleManager.CreateAsync(role);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Không th? t?o Role: {errors}");
            }

            // Thêm các Quy?n h?n n?u có
            if (dto.Permissions != null && dto.Permissions.Any())
            {
                foreach (var permission in dto.Permissions)
                {
                    await roleManager.AddClaimAsync(role, new System.Security.Claims.Claim("Permission", permission));
                }
            }

            return MapToDto(role);
        }
        // Trong RoleService.cs
        public async Task<List<RoleDto>> GetRolesForDropdownAsync()
        {
            // Ch? l?y các Role dang ho?t d?ng c?a Tenant hi?n t?i
            var roles = await _repository.Entities
                .Where(r => r.IsActive)
                .ToListAsync();

            return roles.Select(r => MapToDto(r)).ToList();
        }
    }
}
