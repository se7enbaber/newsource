using AdministrationService.Infrastructure.Data;
using AdministrationService.Infrastructure.Model;
using ShareService.Repositories.Base;

namespace AdministrationService.Repositories.Users
{
    public interface IUserRepository : IBaseRepository<ApplicationUser>
    {
        // Thêm các hàm d?c thù cho User n?u c?n
    }

    public class UserRepository : BaseRepository<ApplicationUser>, IUserRepository
    {
        public UserRepository(ApplicationDbContext context) : base(context)
        {
        }
    }
}

