namespace AdministrationService.Providers
{
    public interface ITenantProvider
    {
        Guid? GetTenantId();
        string? GetConnectionString();
        string? GetDbProvider();
    }
    public class TenantProvider : ITenantProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _configuration;

        public TenantProvider(IHttpContextAccessor httpContextAccessor, 
            IConfiguration configuration)
        {
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
        }
        public Guid? GetTenantId()
        {
            if (_httpContextAccessor.HttpContext?.Items.TryGetValue("tenant_id", out var itemId) == true && itemId is Guid gId)
                return gId;

            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_id")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }

        public string? GetConnectionString()
        {
            // 1. Kiểm tra trong Items trước (được set lúc Login)
            if (_httpContextAccessor.HttpContext?.Items.TryGetValue("tenant_conn", out var itemConn) == true && itemConn is string sConn)
                return sConn;

            // 2. Lấy ConnectionString riêng từ Token
            var conn = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_conn")?.Value;
            if (!string.IsNullOrEmpty(conn)) return conn;

            // 2. Nếu không có (ví dụ đang login hoặc hệ thống chung), trả về null để dùng DefaultConnection
            return null;
        }

        public string? GetDbProvider()
        {
            if (_httpContextAccessor.HttpContext?.Items.TryGetValue("tenant_provider", out var itemProv) == true && itemProv is string sProv)
                return sProv;

            var provider = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_provider")?.Value;
            return provider ?? _configuration["TenantSettings:DefaultProvider"];
        }
    }
}
