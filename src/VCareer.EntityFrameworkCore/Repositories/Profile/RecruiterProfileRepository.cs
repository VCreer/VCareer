using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Profile;
using VCareer.Models.Users;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Profile
{
    public class RecruiterProfileRepository : EfCoreRepository<VCareerDbContext, RecruiterProfile, Guid>, IRecruiterRepository
    {
        public RecruiterProfileRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }
    }
}
