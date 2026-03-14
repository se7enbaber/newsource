using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using ShareService.Repositories.Base;

namespace AdministrationService.Repositories.Roles
{
    public interface IRoleRepository : IBaseRepository<ApplicationRole> { }

    public class RoleRepository(ApplicationDbContext context)
        : BaseRepository<ApplicationRole>(context), IRoleRepository
    { }
}
