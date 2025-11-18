using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Job;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    public class RecruitmentCampainRepository : EfCoreRepository<VCareerDbContext, RecruitmentCampaign, Guid>, IRecruitmentCampainRepository
    {
        public RecruitmentCampainRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }
    }
}
