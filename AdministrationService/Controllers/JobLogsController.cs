using AdministrationService.Repositories.Jobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AdministrationService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class JobLogsController : ControllerBase
    {
        private readonly IJobLogRepository _jobLogRepository;

        public JobLogsController(IJobLogRepository jobLogRepository)
        {
            _jobLogRepository = jobLogRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 10, 
            [FromQuery] Guid? tenantId = null,
            [FromQuery] DateTimeOffset? fromDate = null,
            [FromQuery] DateTimeOffset? toDate = null)
        {
            var query = _jobLogRepository.Entities;
            
            // If caller is not a Super Admin, we might want to force it, but let's just 
            // use what's passed or provided by tenantId if we want to be explicit.
            if (tenantId.HasValue)
            {
                query = query.Where(x => x.TenantId == tenantId);
            }

            if (fromDate.HasValue)
            {
                // Ensure we use UtcDateTime and SpecifyKind to be 100% sure for Npgsql
                var fromUtc = DateTime.SpecifyKind(fromDate.Value.UtcDateTime, DateTimeKind.Utc);
                query = query.Where(x => x.CreatedAt >= fromUtc);
            }

            if (toDate.HasValue)
            {
                // Ensure we use UtcDateTime and SpecifyKind to be 100% sure for Npgsql
                var toUtc = DateTime.SpecifyKind(toDate.Value.UtcDateTime, DateTimeKind.Utc);
                query = query.Where(x => x.CreatedAt <= toUtc);
            }

            var totalCount = await query.CountAsync();
            var logs = await query.OrderByDescending(x => x.CreatedAt)
                                .Skip((pageNumber - 1) * pageSize)
                                .Take(pageSize)
                                .ToListAsync();
            
            return Ok(new { items = logs, totalCount = totalCount });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLog(Guid id)
        {
            var log = await _jobLogRepository.GetByIdAsync(id);
            if (log == null) return NotFound();
            return Ok(log);
        }

        [HttpGet("tenant/{tenantId}")]
        public async Task<IActionResult> GetTenantLogs(Guid tenantId)
        {
            // Note: BaseRepository.FindAsync could be used here
            var logs = await _jobLogRepository.FindAsync(x => x.TenantId == tenantId);
            return Ok(logs.OrderByDescending(x => x.CreatedAt));
        }
    }
}
