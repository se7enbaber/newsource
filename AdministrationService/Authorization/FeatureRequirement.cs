using AdministrationService.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using OpenIddict.Abstractions;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AdministrationService.Authorization;

// 1. Requirement: Lưu trữ tên Feature cần kiểm tra
public class FeatureRequirement(string feature) : IAuthorizationRequirement
{
    public string Feature { get; } = feature;
}

// 2. Dynamic Handler: Kiểm tra Feature trong JWT Claims (loại 'Feature')
public class FeatureAuthorizationHandler(ILogger<FeatureAuthorizationHandler> logger)
    : AuthorizationHandler<FeatureRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, FeatureRequirement requirement)
    {
        if (context.User == null) return Task.CompletedTask;

        // 1. Kiểm tra ưu tiên cho Admin (S.Admin có toàn bộ feature)
        var roleClaims = context.User.Claims
            .Where(c => c.Type == "role" || c.Type == OpenIddictConstants.Claims.Role || c.Type == ClaimTypes.Role)
            .Select(c => c.Value).ToList();

        var isAdmin = roleClaims.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase));
        if (isAdmin)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 2. Kiểm tra feature trong JWT Claims
        var features = context.User.Claims
            .Where(c => c.Type == "Feature" || c.Type == "Features")
            .Select(c => c.Value).ToList();

        if (features.Any(f => f.Equals(requirement.Feature, StringComparison.OrdinalIgnoreCase)))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        logger.LogWarning("FEATURE NOT ENABLED: '{Feature}' for Tenant. User: {User}", requirement.Feature, context.User.Identity?.Name);
        return Task.CompletedTask;
    }
}

// 3. Attribute để bảo vệ Controller/Action
public class RequiredFeatureAttribute : AuthorizeAttribute
{
    public const string PolicyPrefix = "FEATURE:";
    
    public RequiredFeatureAttribute(string feature) : base(policy: $"{PolicyPrefix}{feature}")
    {
    }
}
