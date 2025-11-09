using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using VCareer.Dto.JobDto;
using Volo.Abp.Application.Services;

namespace VCareer.Job.JobPosting.ISerices
{
    public interface IJobSearchService : IApplicationService
    {
        Task<PagedResultDto<JobViewWithPriorityDto>> SearchJobsAsync(JobSearchInputDto input);
        Task<JobViewDetail> GetJobBySlugAsync(string slug);
        Task<JobViewDetail> GetJobByIdAsync(Guid jobId);
        Task<List<JobViewWithPriorityDto>> GetRelatedJobsAsync(Guid jobId, int maxCount = 10);
        Task ReindexAllJobsAsync();
        Task IndexJobAsync(Guid jobId);
        Task RemoveJobFromIndexAsync(Guid jobId);
    }
}
