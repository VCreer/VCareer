using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{
    public interface IJobPostingRepository : IRepository<Job_Posting, Guid>
    {
        //lấy các job có tinh chất là gấp
        Task<List<Job_Posting>> GetUrgentJobsAsync(int limit); 
    }
}
