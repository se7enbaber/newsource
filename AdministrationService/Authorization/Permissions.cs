namespace AdministrationService.Authorization;

public static class Permissions
{
    public const string PermissionService = "AdministrationService";

    public static class Users
    {
        public const string View = PermissionService + ".Users.View";
        public const string Create = PermissionService + ".Users.Create";
        public const string Edit = PermissionService + ".Users.Edit";
        public const string Delete = PermissionService + ".Users.Delete";
    }

    public static class Roles
    {
        public const string View = PermissionService + ".Roles.View";
        public const string Create = PermissionService + ".Roles.Create";
        public const string Edit = PermissionService + ".Roles.Edit";
        public const string Delete = PermissionService + ".Roles.Delete";
    }

    public static class Tenants
    {
        public const string View = PermissionService + ".Tenants.View";
        public const string Create = PermissionService + ".Tenants.Create";
        public const string Edit = PermissionService + ".Tenants.Edit";
        public const string Delete = PermissionService + ".Tenants.Delete";
    }

    public static class Dashboard
    {
        public const string View = PermissionService + ".Dashboard.View";
    }

    public static class Products
    {
        public const string View = PermissionService + ".Products.View";
        public const string Create = PermissionService + ".Products.Create";
        public const string Edit = PermissionService + ".Products.Edit";
        public const string Delete = PermissionService + ".Products.Delete";
    }

    public static class Pricing
    {
        public const string View = PermissionService + ".Pricing.View";
        public const string Create = PermissionService + ".Pricing.Create";
        public const string Edit = PermissionService + ".Pricing.Edit";
        public const string Delete = PermissionService + ".Pricing.Delete";
    }

    // Helper để lấy tất cả permissions (dùng cho seeding hoặc UI)
    public static List<string> GetAll()
    {
        return typeof(Permissions)
            .GetNestedTypes()
            .SelectMany(t => t.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy))
            .Where(f => f.IsLiteral && !f.IsInitOnly && f.FieldType == typeof(string))
            .Select(x => (string)x.GetValue(null)!)
            .ToList();
    }
}
