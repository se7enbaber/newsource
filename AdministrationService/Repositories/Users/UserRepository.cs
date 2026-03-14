using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using ShareService.Repositories.Base;

namespace AdministrationService.Repositories.Users
{
    public interface IUserRepository : IBaseRepository<ApplicationUser> { }

    public class UserRepository(ApplicationDbContext context)
        : BaseRepository<ApplicationUser>(context), IUserRepository
    { }
}
