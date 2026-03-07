using Microsoft.AspNetCore.Authorization;

namespace AdministrationService.Authorization;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission) : base(policy: permission)
    {
    }
}
