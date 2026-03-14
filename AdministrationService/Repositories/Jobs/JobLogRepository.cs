using AdministrationService.Infrastructure.Data;
using ShareService.Infrastructure.Model.Base;
using ShareService.Repositories.Base;

namespace AdministrationService.Repositories.Jobs
{
    public interface IJobLogRepository : IBaseRepository<JobLog> { }

    public class JobLogRepository(ApplicationDbContext context)
        : BaseRepository<JobLog>(context), IJobLogRepository
    { }
}
