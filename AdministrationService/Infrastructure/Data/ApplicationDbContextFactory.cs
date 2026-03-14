using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using ShareService.Services.Base;

namespace AdministrationService.Infrastructure.Data
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.Development.json", optional: true)
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection");
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            
            // Default to PostgreSQL for design-time
            optionsBuilder.UseNpgsql(connectionString);

            var services = new ServiceCollection();
            services.AddScoped<ITenantService, DesignTimeTenantService>();
            var serviceProvider = services.BuildServiceProvider();

            return new ApplicationDbContext(
                optionsBuilder.Options, 
                serviceProvider.GetRequiredService<ITenantService>(), 
                serviceProvider);
        }
    }

    public class DesignTimeTenantService : ITenantService
    {
        public Guid TenantId { get; set; } = Guid.Empty;
    }
}
