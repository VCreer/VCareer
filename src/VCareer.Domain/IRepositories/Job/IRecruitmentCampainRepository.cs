using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.Job
{
    public interface IRecruitmentCampainRepository : IRepository<RecruitmentCampaign, Guid>
    {
    }
}
