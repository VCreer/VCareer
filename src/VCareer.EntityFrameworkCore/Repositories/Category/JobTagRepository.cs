using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Category;
using VCareer.IRepositories.Job;
using VCareer.Models.Job;
using VCareer.Models.JobCategory;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Category
{
    public class JobTagRepository : EfCoreRepository<VCareerDbContext, JobTag, int>, IJobTagRepository
    {
        public JobTagRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }
    }
}
