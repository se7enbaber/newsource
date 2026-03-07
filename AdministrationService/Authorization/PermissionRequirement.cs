using AdministrationService.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using System.Security.Claims;

namespace AdministrationService.Authorization;

// 1. Requirement: Lưu trữ tên Permission cần kiểm tra
public class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}

// 2. Dynamic Handler: Truy vấn Permission của User tại thời điểm Request từ JWT Claims (đã load từ login)
public class PermissionAuthorizationHandler(ILogger<PermissionAuthorizationHandler> logger)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User == null) return Task.CompletedTask;

        // 1. Kiểm tra ưu tiên cho Admin (check tất cả dạng claim có thể có)
        var allClaims = context.User.Claims.ToList();
        var roleClaims = allClaims.Where(c =>
            c.Type == "role" ||
            c.Type == OpenIddictConstants.Claims.Role ||
            c.Type == System.Security.Claims.ClaimTypes.Role
        ).Select(c => c.Value).ToList();

        var isAdmin = roleClaims.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase));

        if (isAdmin)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 2. Kiểm tra permissions trong JWT Claims
        var hasPermission = allClaims.Any(c => c.Type == "Permission" && c.Value == requirement.Permission);
        if (hasPermission)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Log để debug khi bị 403
        logger.LogWarning(
            "ACCESS DENIED for permission '{Permission}'. Roles found: [{Roles}]. All claim types: [{ClaimTypes}]",
            requirement.Permission,
            string.Join(", ", roleClaims),
            string.Join(", ", allClaims.Select(c => $"{c.Type}={c.Value}").Take(10))
        );

        return Task.CompletedTask;
    }
}

// 3. Policy Provider: Tự động tạo Policy từ string (VD: [HasPermission(Permissions.Users.View)])
public class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    public DefaultAuthorizationPolicyProvider FallbackPolicyProvider { get; }

    public PermissionPolicyProvider(Microsoft.Extensions.Options.IOptions<AuthorizationOptions> options)
    {
        FallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => FallbackPolicyProvider.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => FallbackPolicyProvider.GetFallbackPolicyAsync();

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // 1. Logic cho Permission (Khai báo trực tiếp từ hằng số Permissions)
        if (policyName.StartsWith(Permissions.PermissionService + ".", StringComparison.OrdinalIgnoreCase) || 
            policyName.StartsWith("Permissions.", StringComparison.OrdinalIgnoreCase))
        {
            var policy = new AuthorizationPolicyBuilder();
            policy.AddRequirements(new PermissionRequirement(policyName));
            return Task.FromResult<AuthorizationPolicy?>(policy.Build());
        }

        // 2. Logic cho Feature (Khai báo qua RequiredFeatureAttribute)
        if (policyName.StartsWith(RequiredFeatureAttribute.PolicyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var feature = policyName.Substring(RequiredFeatureAttribute.PolicyPrefix.Length);
            var policy = new AuthorizationPolicyBuilder();
            policy.AddRequirements(new FeatureRequirement(feature));
            return Task.FromResult<AuthorizationPolicy?>(policy.Build());
        }

        return FallbackPolicyProvider.GetPolicyAsync(policyName);
    }
}
