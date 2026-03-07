using ShareService.Infrastructure.Model.Base;
using ShareService.Repositories.Base;
using AdministrationService.Infrastructure.Data;

namespace AdministrationService.Repositories.Jobs
{
    public interface IJobLogRepository : IBaseRepository<JobLog>
    {
    }

    public class JobLogRepository : BaseRepository<JobLog>, IJobLogRepository
    {
        public JobLogRepository(ApplicationDbContext context) : base(context)
        {
        }
    }
}
