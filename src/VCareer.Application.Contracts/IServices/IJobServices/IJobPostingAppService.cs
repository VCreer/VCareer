using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using Volo.Abp.Application.Services;

namespace VCareer.Job.JobPosting.ISerices
{
    public interface IJobPostingAppService : IApplicationService
    {

        // search
        Task<PagedResultDto<JobViewDto>> SearchJobsAsync(JobSearchInputDto input);

        // chi tiết job theo slug
        Task<JobViewDetail> GetJobBySlugAsync(string slug);

        // chi tiết job theo id
        Task<JobViewDetail> GetJobByIdAsync(Guid jobId);

        // Get related
        Task<List<JobViewDto>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10);

        // tăng view
     //   Task IncrementViewCountAsync(Guid jobId);




        // Indexing
        Task ReindexAllJobsAsync();
        Task IndexJobAsync(Guid jobId);
        Task RemoveJobFromIndexAsync(Guid jobId);


       
    }
}
