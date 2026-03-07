using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Infrastructure.Model.DTOs;
using AdministrationService.Repositories.Tenants;
using ShareService.Services.Base;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Microsoft.Data.SqlClient;
using System.Security.Claims;
using Hangfire;

namespace AdministrationService.Services
{
    // Đổi tên thành ITenantAppService để không trùng với ITenantService (dùng cho current context)
    public interface ITenantAppService : IBaseService<Tenant, TenantDto, CreateTenantDto>
    {
        Task<bool> MigrateAsync(Guid id);
        Task<(bool success, string message)> CheckConnectionAsync(string connectionString, string provider);
    }

    public class TenantAppService : BaseService<Tenant, TenantDto, CreateTenantDto>, ITenantAppService
    {
        private readonly ITenantRepository _tenantRepository;
        private readonly IServiceProvider _serviceProvider;
        private readonly IPasswordHasher<ApplicationUser> _passwordHasher;
        private readonly ITenantDbSeedService _seedService;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly ILogger<TenantAppService> _logger;

        public TenantAppService(
            ITenantRepository repository,
            ITenantService currentTenantContext,
            IServiceProvider serviceProvider,
            IPasswordHasher<ApplicationUser> passwordHasher,
            ITenantDbSeedService seedService,
            IBackgroundJobClient backgroundJobClient,
            ILogger<TenantAppService> logger) : base(repository, currentTenantContext)
        {
            _tenantRepository = repository;
            _serviceProvider = serviceProvider;
            _passwordHasher = passwordHasher;
            _seedService = seedService;
            _backgroundJobClient = backgroundJobClient;
            _logger = logger;
        }

        public async Task<(bool success, string message)> CheckConnectionAsync(string connectionString, string provider)
        {
            if (string.IsNullOrWhiteSpace(connectionString)) 
                return (false, "Chuỗi kết nối không được để trống.");

            try
            {
                var prov = provider?.ToLower() ?? "postgresql";
                string testConnectionString = connectionString;

                // Patch localhost if running in Docker container EARLY
                if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
                {
                    if (testConnectionString.Contains("localhost") || testConnectionString.Contains("127.0.0.1"))
                    {
                        testConnectionString = testConnectionString.Replace("localhost", "postgres").Replace("127.0.0.1", "postgres");
                    }
                }

                // Để kiểm tra Login/Host mà không quan tâm DB đã tạo hay chưa, 
                // ta nên trỏ về DB hệ thống mặc định nếu có thể.
                if (prov == "postgresql")
                {
                    var builder = new Npgsql.NpgsqlConnectionStringBuilder(testConnectionString);
                    builder.Database = "postgres"; // DB hệ thống luôn có sẵn
                    testConnectionString = builder.ConnectionString;
                }
                else if (prov == "sqlserver")
                {
                    var builder = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(testConnectionString);
                    builder.InitialCatalog = "master"; // DB hệ thống luôn có sẵn
                    testConnectionString = builder.ConnectionString;
                }

                var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
                switch (prov)
                {
                    case "sqlserver": optionsBuilder.UseSqlServer(testConnectionString); break;
                    case "mysql": optionsBuilder.UseMySql(testConnectionString, ServerVersion.AutoDetect(testConnectionString)); break;
                    case "postgresql":
                    default: optionsBuilder.UseNpgsql(testConnectionString); break;
                }

                using var context = new ApplicationDbContext(optionsBuilder.Options, _tenantService, _serviceProvider);
                
                // Thử kết nối tới Host/Server
                var canConnect = await context.Database.CanConnectAsync();
                if (!canConnect)
                    return (false, "Không thể đăng nhập vào Server. Vui lòng kiểm tra Host/User/Password.");
                
                return (true, "Xác thực Host thành công!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xác thực Host cho connection string: {ConnectionString}", connectionString);
                return (false, $"Lỗi xác thực Host: {ex.Message}");
            }
        }

        public async Task<bool> MigrateAsync(Guid id)
        {
            var tenant = await _tenantRepository.GetByIdAsync(id);
            if (tenant == null || string.IsNullOrEmpty(tenant.ConnectionString)) return false;

            // Đưa việc Migration vào Hangfire để chạy ngầm (tránh timeout request)
            _backgroundJobClient.Enqueue<ITenantMigrationJob>(job => job.RunMigrationAsync(tenant.Id, _tenantService.TenantId));
            
            return true;
        }

        protected override TenantDto MapToDto(Tenant entity)
        {
            return new TenantDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Code = entity.Code,
                DbProvider = entity.DbProvider,
                ConnectionString = entity.ConnectionString,
                IsMigrated = entity.IsMigrated,
                LastMigratedAt = entity.LastMigratedAt,
                CreatedAt = entity.CreatedAt,
                LogoUrl = entity.LogoUrl
            };
        }

        protected override Tenant MapToEntity(CreateTenantDto dto)
        {
            return new Tenant
            {
                Name = dto.Name,
                Code = dto.Code,
                DbProvider = dto.DbProvider,
                ConnectionString = dto.ConnectionString,
                LogoUrl = dto.LogoUrl
            };
        }

        public override async Task<TenantDto> CreateAsync(CreateTenantDto dto)
        {
            // 1. Kiểm tra mã tồn tại
            var existing = await _tenantRepository.GetByCodeAsync(dto.Code);
            if (existing != null) throw new Exception("Mã Tenant đã tồn tại trên hệ thống.");

            // 2. Tạo Tenant
            var tenant = MapToEntity(dto);
            await _tenantRepository.AddAsync(tenant);
            await _tenantRepository.SaveChangesAsync();

            // 3. Cập nhật Features cho Tenant mới
            if (dto.Features != null && dto.Features.Any())
            {
                await _tenantRepository.UpdateFeaturesAsync(tenant.Id, dto.Features);
                await _tenantRepository.SaveChangesAsync();
            }

            return MapToDto(tenant);
        }

        public override async Task<bool> UpdateAsync(Guid id, CreateTenantDto dto)
        {
            var tenant = await _tenantRepository.GetByIdAsync(id);
            if (tenant == null) return false;

            // 1. Cập nhật thông tin cơ bản (Không cập nhật Code vì nó dùng làm ID định danh trong nhiều logic)
            tenant.Name = dto.Name;
            tenant.DbProvider = dto.DbProvider;
            tenant.ConnectionString = dto.ConnectionString;
            tenant.LogoUrl = dto.LogoUrl;

            _tenantRepository.Update(tenant);

            // 2. Đồng bộ danh sách Features
            await _tenantRepository.UpdateFeaturesAsync(id, dto.Features);

            return await _tenantRepository.SaveChangesAsync();
        }

        // Override GetPagedAsync để lọc bỏ Tenant 'Host' và nạp danh sách Features cho từng item
        public override async Task<(List<TenantDto> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize)
        {
            // Lọc bỏ Host vì đây là Tenant hệ thống (Case-insensitive)
            var query = _tenantRepository.Entities.Where(t => t.Code.Trim().ToUpper() != "HOST");
            
            int total = await query.CountAsync();
            var items = await query.Skip((pageNumber - 1) * pageSize)
                                   .Take(pageSize)
                                   .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            
            // Nạp thêm features cho từng DTO
            foreach (var dto in dtos)
            {
                dto.Features = await _tenantRepository.GetFeaturesAsync(dto.Id);
            }
            
            return (dtos, total);
        }

        // Override lại GetByIdAsync để nạp thêm list Features từ bảng liên kết
        public override async Task<TenantDto?> GetByIdAsync(Guid id)
        {
            var tenant = await _repository.GetByIdAsync(id);
            if (tenant == null) return null;

            var dto = MapToDto(tenant);
            dto.Features = await _tenantRepository.GetFeaturesAsync(id);
            return dto;
        }
    }
}

