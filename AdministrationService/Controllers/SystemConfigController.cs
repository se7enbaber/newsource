using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

namespace AdministrationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Chỉ Host Tenant hoặc User có quyền Admin System (tương đương với Master Tenant) mới được sửa Config cấu hình
    // Ở đây ta dùng [Authorize] kết hợp Claims "TenantId" nếu cần chặn riêng biệt. 
    // Tạm thời bảo vệ bằng JWT Token Authentication cơ bản
    [Authorize] 
    public class SystemConfigController : ControllerBase
    {
        private readonly IDistributedCache _cache;

        public SystemConfigController(IDistributedCache cache)
        {
            _cache = cache;
        }

        public class RateLimitConfig
        {
            public int GlobalLimit { get; set; }
            public int AuthLimit { get; set; }
        }

        [HttpGet("rate-limit")]
        public async Task<IActionResult> GetRateLimitConfig()
        {
            var globalStr = await _cache.GetStringAsync("RateLimit:Global:PermitLimit") ?? "100";
            var authStr = await _cache.GetStringAsync("RateLimit:Auth:PermitLimit") ?? "5";

            return Ok(new RateLimitConfig
            {
                GlobalLimit = int.Parse(globalStr),
                AuthLimit = int.Parse(authStr)
            });
        }

        [HttpPost("rate-limit")]
        public async Task<IActionResult> UpdateRateLimitConfig([FromBody] RateLimitConfig config)
        {
            // Set expire time for infinite or long duration
            var options = new DistributedCacheEntryOptions();

            await _cache.SetStringAsync("RateLimit:Global:PermitLimit", config.GlobalLimit.ToString(), options);
            await _cache.SetStringAsync("RateLimit:Auth:PermitLimit", config.AuthLimit.ToString(), options);

            return Ok(new { Message = "Rate limit configuration updated successfully and applied dynamically." });
        }
    }
}
