namespace AdministrationService.Authorization;

public static class Features
{
    public const string FeatureService = "Feature";

    public static class Administration
    {
        public const string Main = FeatureService + ".Administration";
        public const string Users = Main + ".Users";
        public const string Roles = Main + ".Roles";
    }

    public static class MDM
    {
        public const string Main = FeatureService + ".MDM";
        public const string Products = Main + ".Products";
    }

    public static class Pricing
    {
        public const string Main = FeatureService + ".Pricing";
        public const string PricingList = Main + ".PricingList";
    }

    // Helper để lấy tất cả features (dùng cho seeding hoặc UI quản lý Tenant)
    public static List<string> GetAll()
    {
        var features = new List<string>();
        var nestedTypes = typeof(Features).GetNestedTypes();
        
        foreach (var type in nestedTypes)
        {
            var fields = type.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy)
                .Where(f => f.IsLiteral && !f.IsInitOnly && f.FieldType == typeof(string));
                
            foreach (var field in fields)
            {
                features.Add((string)field.GetValue(null)!);
            }
        }
        return features;
    }
}
