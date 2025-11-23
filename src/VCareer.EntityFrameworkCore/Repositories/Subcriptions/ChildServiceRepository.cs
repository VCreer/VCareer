using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Subcriptions;
using VCareer.Models.Subcription;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Subcriptions
{
    public class ChildServiceRepository : EfCoreRepository<VCareerDbContext, ChildService, Guid>, IChildServiceRepository
    {
        public ChildServiceRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }
    }
}
