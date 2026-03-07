using System.Reflection;

namespace AdministrationService.Extensions
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            // 1. Tự động đăng ký tất cả các Repositories
            // Tìm các class có tên kết thúc bằng "Repository" và đăng ký với Interface tương ứng
            services.RegisterAssemblyPublicNonGenericClasses(Assembly.GetExecutingAssembly(), "Repository");

            // 2. Tự động đăng ký tất cả các Services
            // Tìm các class có tên kết thúc bằng "Service"
            services.RegisterAssemblyPublicNonGenericClasses(Assembly.GetExecutingAssembly(), "Service");

            // 3. Tự động đăng ký các Jobs (Hangfire)
            services.RegisterAssemblyPublicNonGenericClasses(Assembly.GetExecutingAssembly(), "Job");

            // Register background workers or services without interfaces explicitly
            services.AddScoped<AdministrationService.Services.Jobs.JobCleanupService>();

            return services;
        }

        private static void RegisterAssemblyPublicNonGenericClasses(this IServiceCollection services, Assembly assembly, string suffix)
        {
            var types = assembly.GetExportedTypes()
                .Where(t => t.IsClass && !t.IsAbstract && t.Name.EndsWith(suffix));

            foreach (var type in types)
            {
                var interfaceType = type.GetInterfaces().FirstOrDefault(i => i.Name == $"I{type.Name}");
                if (interfaceType != null)
                {
                    services.AddScoped(interfaceType, type);
                }
            }
        }
    }
}
