using System.Threading.Tasks;
using Hangfire;
using Microsoft.Extensions.Logging;

namespace AdministrationService.Services.Jobs
{
    public class AiQuotaResetJob
    {
        private readonly IAiGovernanceService _aiGovernanceService;
        private readonly ILogger<AiQuotaResetJob> _logger;

        public AiQuotaResetJob(IAiGovernanceService aiGovernanceService, ILogger<AiQuotaResetJob> logger)
        {
            _aiGovernanceService = aiGovernanceService;
            _logger = logger;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Starting Recurring Job: AI Quota Monthly Reset...");
            await _aiGovernanceService.ResetQuotasAsync();
            _logger.LogInformation("AI Quota Monthly Reset completed successfully.");
        }
    }
}
