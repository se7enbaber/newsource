using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using ShareService.Repositories.Base;

namespace AdministrationService.Repositories.Users
{
    public interface IRoleRepository : IBaseRepository<ApplicationRole> { }

    public class RoleRepository(ApplicationDbContext context)
        : BaseRepository<ApplicationRole>(context), IRoleRepository
    { }
}

