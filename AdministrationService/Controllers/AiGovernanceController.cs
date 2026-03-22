using System;
using System.Threading.Tasks;
using AdministrationService.Infrastructure.Model;
using AdministrationService.Services;
using AdministrationService.Services.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AdministrationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiGovernanceController : ControllerBase
    {
        private readonly IAiGovernanceService _aiGovernanceService;
        private readonly ISignalRNotificationService _notificationService;
        private readonly IConfiguration _configuration;

        public AiGovernanceController(
            IAiGovernanceService aiGovernanceService, 
            ISignalRNotificationService notificationService,
            IConfiguration configuration)
        {
            _aiGovernanceService = aiGovernanceService;
            _notificationService = notificationService;
            _configuration = configuration;
        }

        /// <summary>
        /// Ghi log sử dụng AI từ AiService (Internal API)
        /// </summary>
        [HttpPost("log")]
        [AllowAnonymous]
        public async Task<IActionResult> LogUsage([FromBody] AiUsageLog log)
        {
            // Bảo mật đơn giản: Check internal secret header
            var internalApiSecret = _configuration["InternalApiSecret"] ?? "default_ai_secret_123";
            var requestSecret = Request.Headers["X-Internal-Secret"].ToString();

            if (requestSecret != internalApiSecret)
            {
                return Unauthorized("Invalid internal API secret");
            }

            try
            {
                await _aiGovernanceService.LogUsageAsync(log);

                // Kiểm tra xem đã vượt ngưỡng chưa để gửi thông báo
                var quota = await _aiGovernanceService.GetTenantQuotaAsync(log.TenantId);
                if (quota != null)
                {
                    double usagePercent = (double)quota.CurrentUsedTokens / quota.MonthlyTokenLimit;
                    if (usagePercent >= 1.0)
                    {
                        await _notificationService.SendNotificationAsync(log.TenantId, "AI Quota Exceeded", "Bạn đã hết hạn mức AI cho tháng này. Dịch vụ đã bị khóa.", "error");
                    }
                    else if (usagePercent >= 0.9)
                    {
                        await _notificationService.SendNotificationAsync(log.TenantId, "AI Quota Warning", "Bạn đã sử dụng trên 90% hạn mức AI tháng này.", "warning");
                    }
                }

                return Ok(new { status = "success" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        /// <summary>
        /// Lấy hạn mức hiện tại của Tenant (Admin/User)
        /// </summary>
        [HttpGet("quota/{tenantId}")]
        [Authorize]
        public async Task<IActionResult> GetQuota(Guid tenantId)
        {
            var quota = await _aiGovernanceService.GetTenantQuotaAsync(tenantId);
            if (quota == null) 
            {
                // Return a default quota instead of 404 to gracefully handle new tenants
                return Ok(new AiQuota 
                { 
                    TenantId = tenantId, 
                    MonthlyTokenLimit = 1000000, 
                    MonthlyCostLimitUsd = 10.0m,
                    CurrentUsedTokens = 0,
                    CurrentUsedCostUsd = 0,
                    LastResetDate = DateTime.UtcNow,
                    IsBlocked = false
                });
            }
            return Ok(quota);
        }

        /// <summary>
        /// Kiểm tra trạng thái khóa của Tenant
        /// </summary>
        [HttpGet("check-status/{tenantId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckStatus(Guid tenantId)
        {
            var isBlocked = await _aiGovernanceService.IsQuotaExceededAsync(tenantId);
            return Ok(new { isBlocked });
        }

        /// <summary>
        /// Cấu hình hạn mức (Global Admin)
        /// </summary>
        [HttpPost("config-quota")]
        [Authorize(Roles = "Admin,Host")]
        public async Task<IActionResult> UpdateQuota([FromBody] UpdateQuotaRequest request)
        {
            var quota = await _aiGovernanceService.UpdateQuotaAsync(request.TenantId, request.MaxTokens, request.MaxCost);
            return Ok(quota);
        }

        public class UpdateQuotaRequest
        {
            public Guid TenantId { get; set; }
            public long? MaxTokens { get; set; }
            public decimal? MaxCost { get; set; }
        }
    }
}
