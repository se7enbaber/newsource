using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Infrastructure.Model.DTOs;
using AdministrationService.Repositories.Users;
using ShareService.Services.Base;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace AdministrationService.Services.Users
{
    public interface IUserService : IBaseService<ApplicationUser, UserDto, CreateUserDto>
    {
        Task<IdentityResult> ResetPasswordAsync(Guid userId, string newPassword); // Dùng cho Admin
        Task<PagedResult<UserDto>> GetPagedUsersAsync(PaginationParams @params);
    }

    public class UserService(
        IUserRepository userRepository,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        ITenantService tenantService) : BaseService<ApplicationUser, UserDto, CreateUserDto>(userRepository, tenantService), IUserService
    {
        public async Task<List<UserDto>> GetUsersAsync()
        {
            // T?n d?ng Global Query Filter dã c?u hình ? Context
            var users = await userManager.Users.ToListAsync();

            return users.Select(u => new UserDto
            {
                Id = u.Id,
                UserName = u.UserName!,
                Email = u.Email!
            }).ToList();
        }

        public async Task<IdentityResult> CreateUserAsync(CreateUserDto dto)
        {
            if(string.IsNullOrEmpty(dto.Password))
                throw new Exception("Password không du?c d? tr?ng.");

            var user = new ApplicationUser
            {
                UserName = dto.UserName,
                Email = dto.Email,
                TenantId = _tenantService.TenantId // Gán TenantId t? Middleware
            };
            var result = await userManager.CreateAsync(user, dto.Password);
            if (result.Succeeded && dto.Roles != null && dto.Roles.Any())
            {
                await AssignRolesAsync(user.Id, _tenantService.TenantId, dto.Roles);
            }
            return result;
        }
        protected override UserDto MapToDto(ApplicationUser entity)
        {
            return new UserDto
            {
                Id = entity.Id,
                UserName = entity.UserName!,
                Email = entity.Email!,
                AvatarUrl = entity.AvatarUrl,
                DateOfBirth = entity.DateOfBirth,
                FullName = entity.FullName ?? string.Empty,
                IsActive = entity.IsActive,
                PhoneNumber = entity.PhoneNumber,
            };
        }

        protected override ApplicationUser MapToEntity(CreateUserDto dto)
        {
            return new ApplicationUser
            {
                UserName = dto.UserName,
                Email = dto.Email,
                FullName = dto.FullName,
                DateOfBirth = dto.DateOfBirth,
                IsActive = dto.IsActive,
                AvatarUrl = dto.AvatarUrl,
                TenantId = _tenantService.TenantId, // T? d?ng gán Tenant
                EmailConfirmed = false
            };
        }
        public override async Task<bool> UpdateAsync(Guid id, CreateUserDto dto)
        {
            // 1. Tìm user b?ng IgnoreQueryFilters d? tránh Global Filter l?c m?t
            //    userManager.FindByIdAsync() di qua EF DbSet có filter TenantId + IsDeleted
            //    ? n?u TenantId không kh?p JWT s? tr? v? null dù user t?n t?i
            var user = await userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                throw new Exception($"Không tìm th?y user v?i Id = {id}.");

            // Ki?m tra Tenant — ch? cho phép s?a user thu?c cùng Tenant
            if (user.TenantId != _tenantService.TenantId)
                throw new Exception($"User này thu?c Tenant khác. TenantId user: {user.TenantId}, TenantId hi?n t?i: {_tenantService.TenantId}.");

            // Ki?m tra soft delete
            if (user.IsDeleted)
                throw new Exception($"User v?i Id = {id} dã b? xóa (soft delete).");

            // 2. C?p nh?t d?y d? thông tin co b?n
            user.Email = dto.Email;
            user.NormalizedEmail = dto.Email.ToUpper();
            user.FullName = dto.FullName;
            user.PhoneNumber = dto.PhoneNumber;
            user.DateOfBirth = dto.DateOfBirth;
            user.IsActive = dto.IsActive;
            user.AvatarUrl = dto.AvatarUrl;

            // C?p nh?t UserName n?u có thay d?i
            if (!string.IsNullOrEmpty(dto.UserName) && user.UserName != dto.UserName)
            {
                user.UserName = dto.UserName;
                user.NormalizedUserName = dto.UserName.ToUpper();
            }

            // 3. Luu thông tin user
            var result = await userManager.UpdateAsync(user);
            if (!result.Succeeded) throw new Exception(string.Join(", ", result.Errors.Select(x => x.Description)));

            // 4. X? lý c?p nh?t Role
            // KHÔNG dùng AddToRolesAsync/RemoveFromRolesAsync vì RoleManager b? Global Query Filter
            // theo TenantId ? tìm Role không ra. Thao tác th?ng trên b?ng UserRoles d? bypass.
            if (dto.Roles != null)
            {
                // Xóa toàn b? role cu tru?c
                var existingUserRoles = await context.Set<IdentityUserRole<Guid>>()
                    .Where(ur => ur.UserId == user.Id)
                    .ToListAsync();

                if (existingUserRoles.Any())
                {
                    context.Set<IdentityUserRole<Guid>>().RemoveRange(existingUserRoles);
                    await context.SaveChangesAsync(); // Save delete TRU?C
                }

                // Sau dó thêm role m?i
                if (dto.Roles.Any())
                {
                    await AssignRolesAsync(user.Id, user.TenantId, dto.Roles);
                }
            }

            // 5. C?p nh?t m?t kh?u n?u có
            if (!string.IsNullOrEmpty(dto.Password))
            {
                var removeResult = await userManager.RemovePasswordAsync(user);
                if (!removeResult.Succeeded) throw new Exception(string.Join(", ", removeResult.Errors.Select(x => x.Description))); ;

                var passwordResult = await userManager.AddPasswordAsync(user, dto.Password);
                if (!passwordResult.Succeeded) throw new Exception(string.Join(", ", passwordResult.Errors.Select(x=>x.Description)));
            }

            return true;
        }
        public async Task<IdentityResult> ResetPasswordAsync(Guid userId, string newPassword)
        {
            var user = await userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return IdentityResult.Failed(new IdentityError { Description = "User not found" });

            // Cách an toàn nh?t: T?o token reset và th?c hi?n reset
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            return await userManager.ResetPasswordAsync(user, token, newPassword);
        }

        public async Task<PagedResult<UserDto>> GetPagedUsersAsync(PaginationParams @params)
        {
            // 1. T?o di?u ki?n l?c
            Expression<Func<ApplicationUser, bool>>? filter = null;
            if (!string.IsNullOrEmpty(@params.SearchTerm))
            {
                filter = u => u.UserName!.Contains(@params.SearchTerm) || u.Email!.Contains(@params.SearchTerm);
            }

            var (items, total) = await _repository.GetPagedAsync(@params.PageNumber, @params.PageSize, filter);
            // 2. Chuy?n sang DTO co b?n tru?c
            var userDtos = items.Select(MapToDto).ToList();
            // 3. X? lý l?y Roles song song b?ng cách t?o Scope riêng cho m?i Task
            foreach (var userDto in userDtos)
            {
                var user = await userManager.Users
                                                    .IgnoreQueryFilters()
                                                    .FirstOrDefaultAsync(u => u.NormalizedUserName == userDto.UserName.ToUpper());
                if (user != null)
                {
                    var roles = await userManager.GetRolesAsync(user);
                    userDto.Roles = roles.ToList();
                }
            }

            return new PagedResult<UserDto>
            {
                Items = userDtos,
                TotalCount = total,
                PageNumber = @params.PageNumber,
                PageSize = @params.PageSize
            };
        }


        public override async Task<UserDto> CreateAsync(CreateUserDto dto)
        {
            var user = MapToEntity(dto);

            var userExist = await userManager.FindByNameAsync(user.UserName!);

            if (userExist == null)
            {
                // User chua t?n t?i ? t?o m?i
                var result = await userManager.CreateAsync(user, dto.Password ?? string.Empty);

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    throw new Exception($"Không th? t?o User: {errors}");
                }
                // Sau CreateAsync, user.Id dã du?c Identity gán Guid h?p l?
            }
            else
            {
                // User dã t?n t?i ? dùng entity có Id h?p l? t? DB
                // tránh dùng object 'user' m?i t?o (có Id = Guid.Empty)
                user = userExist;
            }

            // Gán Role sau khi t?o user thành công (user.Id lúc này luôn h?p l?)
            if (dto.Roles != null && dto.Roles.Any())
            {
                await AssignRolesAsync(user.Id, user.TenantId, dto.Roles);
            }

            return MapToDto(user);
        }

        /// <summary>
        /// Gán danh sách role cho user b?ng cách insert th?ng vào b?ng UserRoles.
        /// KHÔNG dùng userManager.AddToRolesAsync vì RoleManager b? Global Query Filter
        /// theo TenantId - khi không có HTTP context thì TenantId = Guid.Empty ? tìm Role không ra.
        /// </summary>
        private async Task AssignRolesAsync(Guid userId, Guid tenantId, List<string> roleNames)
        {
            var normalizedNames = roleNames.Select(r => r.ToUpper()).ToList();

            var roles = await context.Roles
                .IgnoreQueryFilters()
                .Where(r => normalizedNames.Contains(r.NormalizedName!) && r.TenantId == tenantId)
                .ToListAsync();

            foreach (var role in roles)
            {
                // Tránh duplicate n?u dã t?n t?i
                var exists = await context.Set<IdentityUserRole<Guid>>()
                    .AnyAsync(ur => ur.UserId == userId && ur.RoleId == role.Id);

                if (!exists)
                {
                    context.Set<IdentityUserRole<Guid>>().Add(new IdentityUserRole<Guid>
                    {
                        UserId = userId,
                        RoleId = role.Id
                    });
                }
            }

            await context.SaveChangesAsync();
        }
    }
}

